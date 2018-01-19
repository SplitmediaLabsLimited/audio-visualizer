/* global require, module, __dirname, console, Buffer */

"use strict";

// imports
var fs          = require("fs"),
    path        = require("path"),
    cheerio     = require("cheerio"),
    exec        = require("child_process").exec,
    htmlEncode  = require("htmlencode").htmlEncode,
    vulcanize   = require("vulcanize");

/**
 * Creates an instance of Packager
 *
 * @param {Object} args
 */
function Packager(args)
{
    this.appFolder = args.appFolder;
    this.buildsFolder = args.buildsFolder;
}

Packager.prototype =
{
    /**
     * runs / starts the Packager
     */
    run: function(options)
    {
        var files = fs.readdirSync(this.appFolder);

        options = options || {};

        for (var i in files)
        {
            var filename = files[i],
                filepath = (this.appFolder + filename),
                stat     = fs.statSync(filepath);

            if (stat.isDirectory() || !/.html$/.test(filename))
            {
                continue;
            }

            var buildFilepath = this.buildsFolder + filename;

            if (typeof options.ext === "string")
            {
                buildFilepath = buildFilepath.replace(/.html$/, ".plg");
            }

            fs.writeFileSync(buildFilepath, this.parseHTML(filepath, options));

            this.encrypt(
                buildFilepath, 
                buildFilepath.replace(".plg", "_encrypted." + options.ext)
            );

            // fs.unlinkSync(buildFilepath);
        }
    },

    /**
     * Parses HTML content
     *
     * @param {String} HTML
     */
    parseHTML: function(filepath, options)
    {
        console.info("Parsing HTML: " + filepath + "...");
        
        var packager = this,
            currentPath = path.dirname(filepath),
            $ = cheerio.load(fs.readFileSync(filepath));

        $("link[href]").each(function()
        {
            var $this       = $(this),
                href        = $this.attr("href"),
                rel         = $this.attr("rel"),
                htmlencode  = $this.attr("htmlencode");

            if ($this.attr('external') !== undefined) {
                return;
            }

            var normalizedPath = path.normalize(currentPath + "/" + href);

            if (rel === "import")
            {
                if (!/.xml$/.test(href))
                {
                    $this.replaceWith(packager.parseHTML(
                        normalizedPath,
                        { 
                            htmlencode : String(htmlencode)==="true"
                        }
                    ));
                }
            }
            else
            {
                $this.replaceWith(packager.parseCSS(normalizedPath));
            }
        });

        $("script[src]").each(function()
        {
            var $this = $(this),
                src   = $this.attr("src"),
                type  = $this.attr("type");

            if ($this.attr('external') !== undefined) {
                return;
            }

            if (type === "lang")
            {
                $this.removeAttr("type");
                $this.removeAttr("src");
                
                var langmodule = src.replace(/.*\/|\.json/g, "");
            
                console.info("Parsing Language: " + src + "...");

                var content = fs.readFileSync(currentPath + "\\" + src);

                $this.html("window.addEventListener('load', function(){" +
                           "External.Lang.register('" + langmodule + "', " +
                           content + ");});");

                console.info("Parsing Language: " + src + "[DONE]");
            }
            else
            {
                var normalizedPath = path.normalize(currentPath + "/" + src);

                $this.replaceWith(packager.parseJS(normalizedPath));
            }        
        });
        
        var html       = $.html(),
            imgPattern = /=[ ]?"(.[^"]+\.(jpg|png))"/ig;

        html = this.removeDebugCodes(html);
        
        if (options.htmlencode)
        {
            // Convert existing "&" to &amp;
            html = html.replace(/\&/g, "&amp;");
            html = htmlEncode(html);
        }
        
        html = html.replace(imgPattern, function(match, path)
        {
            if (!fs.existsSync(currentPath + "/" + path))
            {
                return match;
            }
            
            var file = fs.readFileSync(currentPath + "/" + path),
                fileBuffer = new Buffer(file, "binary"),
                base64File = fileBuffer.toString("base64");

            return "=\"data:;base64," + base64File + "\"";
        });
        
        // Remove new lines on plugin tag
        html = html.replace(
            /(<plugin.*>)([\r\n ]*)/i,
            function(match, pluginTag, whiteSpace, offset, string)
            {
                return pluginTag;
            });

        // Check for imports with xml file type
        var pluginXMLTag = 
            /<plugin_xml>[\r\n ]*(<link.+>)[\r\n ]*<\/plugin_xml>/i.exec(html);

        if (pluginXMLTag && pluginXMLTag.length > 0)
        {
            var link = pluginXMLTag[1],
                href = /href=['"](.+)['"]/i.exec(link);

            var normalizedPath = path.normalize(currentPath + "/" + href[1]);

            var content = fs.readFileSync(normalizedPath, "utf8");

            html = html.replace(
                /<plugin_xml>[\r\n ]*(<link.+>)[\r\n ]*<\/plugin_xml>/i,
                function(match, param, offset, string)
                {
                    return "<plugin_xml>" + content + "</plugin_xml>";
                }
            );
        }

        console.info("Parsing HTML: " + filepath + " [DONE]");

        return html;
    },

    /**
     * Parses CSS file
     *
     * @param   {String} cssFile
     * @returns {String} HTML
     */
    parseCSS: function(cssFile)
    {
        console.info("Parsing CSS: " + cssFile + "...");
        
        var cssContent = fs.readFileSync(cssFile),
            cssPath    = path.normalize(path.dirname(cssFile)),
            html       = "<style>" + cssContent + "</style>";

        html = html.replace(/url\(['"]?(.[^'"\)]+)['"]?\)/gi, function(match, path)
        {
            var file = fs.readFileSync(cssPath + "/" + path),
                fileBuffer = new Buffer(file, "binary"),
                base64File = fileBuffer.toString("base64");

            return "url(\"data:;base64," + base64File + "\")";
        });
        
        console.info("Parsing CSS: " + cssFile + " [DONE]");

        return this.removeDebugCodes(html);
    },

    /**
     * Parses JS file
     *
     * @param   {String} jsFile
     * @returns {String} HTML
     */
    parseJS: function(jsFile)
    {
        console.info("Parsing JS: " + jsFile + "...");
        
        var jsContent = fs.readFileSync(jsFile),
            html      = "<script>" + jsContent + "</script>";
        
        console.info("Parsing JS: " + jsFile + " [DONE]");

        return this.removeDebugCodes(html);
    },

    /**
     * Removes debug codes within the codes
     * @param {String} code
     */
    removeDebugCodes: function(code)
    {
        var BEGIN_DEBUG_PATTERN = /(\/[\/\*]|<!--)\s*BEGIN DEBUG\s*(-->|\*\/)?/gi,
            END_DEBUG_PATTERN = /(\/[\/\*]|<!--)\s*END DEBUG\s*(-->|\*\/)?/gi,
            FIRST_GROUP_PATTERN = /^(\/[\/\*]|<!--)$/,
            SECOND_GROUP_PATTERN = /^(-->|\*\/)$/;
        
        var resultantCode = "",
            codeFragments = code.split(BEGIN_DEBUG_PATTERN);
        
        resultantCode += codeFragments.shift();
        
        while (codeFragments.length > 0)
        {
            var fragment = codeFragments.shift();    
            
            if (
                fragment === undefined || 
                FIRST_GROUP_PATTERN.test(fragment) ||
                SECOND_GROUP_PATTERN.test(fragment) )
            {
                continue;
            }
            
            var splittedFragment = fragment.split(END_DEBUG_PATTERN);
            
            if (splittedFragment.length > 1)
            {
                fragment = splittedFragment[splittedFragment.length - 1];
            }
            
            resultantCode += fragment;
        }
        
        return resultantCode;
    },

    encrypt: function(source, output)
    {
        this.execSync(
            "php " + __dirname + "\\encrypt.php " + 
            encodeURIComponent(path.resolve(source)) + " " +
            encodeURIComponent(path.resolve(output))
        );
    },
    
    decrypt: function(source, output)
    {
        this.execSync(
            "php " + __dirname + "\\decrypt.php " + 
            encodeURIComponent(path.resolve(source)) + " " +
            encodeURIComponent(path.resolve(output))
        );
    },

    execSync: function(cmd)
    {
        var done = false, result = "";

        exec(cmd, function(stderr, stdout)
        {
            result = stdout;
            done = true;
        });
        
        while(!done) 
        {
            require("deasync").runLoopOnce();
        }

        return result;
    }
};

module.exports = Packager;
