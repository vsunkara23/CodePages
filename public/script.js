/* public/script.js */
window.onload = function() {
    var md = window.markdownit( {
        html:true,
        linkify:true,
        typographer:true,
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
              try {
                return '<pre class="hljs"><code>' +
                       hljs.highlight(lang, str, true).value +
                       '</code></pre>';
              } catch (__) {}
            }
            return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
        },
    });
    var pad = document.getElementById('pad');
    var markdownArea = document.getElementById('markdown');  
    var convertTextAreaToMarkdown = function(){
        var markdownText = pad.value;
        markdownArea.innerHTML = md.render(markdownText);
    };
    pad.addEventListener('input', convertTextAreaToMarkdown);
    convertTextAreaToMarkdown();
};