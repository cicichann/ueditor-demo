/**
 * User: zxq
 * Date: 2018-06-21
 * Time: 下午15:11
 */

(function() {
    var range = editor.selection.getRange(),
        link = range.collapsed ? editor.queryCommandValue( "toc" ) : editor.selection.getStart(),
        url,
        text = $G('text'),
        rangeLink = domUtils.findParentByTagName(range.getCommonAncestor(),'a',true),
        orgText;
    link = domUtils.findParentByTagName( link, "a", true );
    if(link){
        url = utils.html(link.getAttribute( 'href' ) || link.getAttribute( 'href', 2 )).replace('#','');;
    }
    $G("href").value = url ? url: '';
    $focus($G("href"));

    function handleDialogOk(){
        var href =$G('href').value.replace(/^\s+|\s+$/g, '');
        if(href){
            editor.execCommand('toc', '#' + href );
            dialog.close();
        }
    }
    dialog.onok = handleDialogOk;
    $G('href').onkeydown = function(evt){
        evt = evt || window.event;
        if (evt.keyCode == 13) {
            handleDialogOk();
            return false;
        }
    };
})();