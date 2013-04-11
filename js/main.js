/**
 * @author Alexey Bass @alexey_bass
 * @copyright 2013
 */

(function(window, undefined) {
    
function App() {

    var debug = false;

    var App = {};
    
    App.init = function() {
        _loadDb();
                
        $('#warning button').bind('click', function() {
            $('#warning, #screen').hide();
            $('#screen').removeClass('hidden').fadeIn(1000);
            _updateHeight();
        });
        
        $(window).resize(_updateHeight);
    };
    
    _updateHeight = function() {
        var h = $(window).height();
        if (h > 450) {
            $('#brand ul').height(h - 43);
        }
    };

    var db
    ,   filterBrands = [], filterSaes = []
    ,   filteredDb, filteredCounters
    ,   allBrandCounters, allSaeCounters, allPolyCounters, allCleanCounters;

    _loadDb = function() {
        $.ajax({
            dataType: "json"
        ,   url: "db.json"
        ,   success: function(data) {
                db = _prepareDb(data);
                _populateSelectors(data);
                _postInit();
            }
        });
    };
    
    _prepareDb = function(data) {
        var i;
        
        for (i in data) {
            data[i].id = parseInt(i) + 1;
        }
        
        return data;
    };
    
    _populateSelectors = function(data) {
        var i, brands = [], saes = [];
        
        for (i in data) {
            brands.push(data[i].brand);
            saes.push(data[i].sae);
        }
        
        brands = unique(brands).sort();
        saes = unique(saes).sort(alphanum);
        
        _populateDiv('brand', brands);
        _populateDiv('sae',   saes);
        _populateDiv('tag');
        
        _attachHandlers();
    };
    
    _postInit = function() {
        allBrandCounters = $('input.type-brand:checkbox ~ span.counter');
        allSaeCounters   = $('input.type-sae:checkbox ~ span.counter');
        allPolyCounters  = $('input.type-poly:radio ~ span.counter');
        allCleanCounters = $('input.type-clean:radio ~ span.counter');
        
        _makeDbUsingFilters();
        App.updateCounters();
    };
    
    _populateDiv = function(id, data) {
        var i, h = '';
        
        h+= '<p class="control">';
        h+= '<span class="link select-none type-'+ id +'" title="Снять все галочки">Очистить</span>';
        h+= '</p>';
        
        h+= '<ul>';
        
        if (id === 'tag') {
            h+= '<li>';
            h+= '<label>';
            h+= '<input type="checkbox" class="filter type-poly" value="">';
            h+= ' <span class="color-'+ id +'">полимеризация</span>';
            h+= '</label>';
            h+= '</li>';
            
            h+= '<li class="color-'+ id +' poly-row">';
            h+= '<label class="disabled">';
            h+= '<input type="radio" name="poly" class="filter type-poly" value="1" disabled="disabled"> да';
            h+= ' <span class="counter" value="poly-1"></span>';
            h+= '</label>';
            h+= '&nbsp;&nbsp;';
            h+= '<label class="disabled">';
            h+= '<input type="radio" name="poly" class="filter type-poly" value="0"  disabled="disabled"> нет';
            h+= ' <span class="counter" value="poly-0"></span>';
            h+= '</label>';
            h+= '</li>';
            
            h+= '<li>';
            h+= '<label>';
            h+= '<input type="checkbox" class="filter type-clean" value="">';
            h+= ' <span class="color-'+ id +'">чисто</span>';
            h+= '</label>';
            h+= '</li>';
            
            h+= '<li class="color-'+ id +' clean-row">';
            h+= '<label class="disabled">';
            h+= '<input type="radio" name="clean" class="filter type-clean" value="1" disabled="disabled"> да';
            h+= ' <span class="counter" value="clean-1"></span>';
            h+= '</label>';
            h+= '&nbsp;&nbsp;';
            h+= '<label class="disabled">';
            h+= '<input type="radio" name="clean" class="filter type-clean" value="0"  disabled="disabled"> нет';
            h+= ' <span class="counter" value="clean-0"></span>';
            h+= '</label>';
            h+= '</li>';
        } else {
            for (i in data) {
                h+= '<li>';
                h+= '<label>';
                h+= '<input type="checkbox" class="filter type-'+ id +'" value="'+ data[i] +'">';
                h+= ' <span class="color-'+ id +'">';
                switch (id) {
                    case 'sae':
                        h+= data[i].replace('w', 'w-');
                        break;

                    case 'brand':
                        h+= data[i];
                }
                h+= '</span>';
                h+= ' <span class="counter" value="'+ data[i] +'"></span>';
                h+= '</label>';
                h+= '</li>';
            }
        }
        
        h+= '</ul>';
        
        $('#'+ id).html(h);
    };
    
    _attachHandlers = function() {
        $('input.filter').bind('change', function() {
            _updateFilters($(this));
        });
        
        $('span.select-none').bind('click', function() {
            _uncheckGroup($(this));
        });
        
        $(document).on('click', 'span.chemical', function() {
            _openChemicalWindow($(this));
        });
    };
    
    var _chemicalHtmlTemplate = '<html><head>'
        + '<meta charset="utf-8"><title>%TITLE%</title>'
        + '<link rel="stylesheet" href="css/normalize.css"><style>body{margin:10px;font-size:10pt}</style></head>'
        + '<body>'
        + '<p>%TEXT%</p>'
        + '<p style="font-size:7pt">'
        + 'Внимание: для определения щёлочности используется не ASTM-D2896, а более близкий к нашему ГОСТ - ASTM D4739, который дает около 15% занижения щелочного числа. Следовательно, показатели TBN несколько занижены относительно паспортных.'
        + '<br/>Исследование в закрытом тигле обычно производится для легких нефтепродуктов - этот тест пропорционально занижает точку вспышки на величину около 20 градусов.'
        + '<p>'
        + '<div><img src="%IMG%" /></div>'
        
        + '</body></html>';
    
    _openChemicalWindow = function(trigger) {
        var id = trigger.attr('dbid'), item = _getDbItemById(id)
        ,   win = window.open('', '_blank', 'menubar=no,location=no,resizable=yes,scrollbars=yes,status=no,height=900,width=840');
        
        var html = _chemicalHtmlTemplate;
        html = html.replace('%TITLE%', item.brand +' '+ item.product +' '+ item.sae.replace('w', 'W-'));
        html = html.replace('%TEXT%',  item.chemical.text);
        html = html.replace('%IMG%',   item.chemical.img);
        
        win.document.write(html);
    };
    
    _getDbItemById = function(id) {
        return db[id - 1];
    };
    
    _updateFilters = function(selector) {
        if (debug) {
            var timer = (new Date()).getTime();
        }
        
        var isCheckbox = selector.is('input') // can be 'select-none' trigger
        ,   isChecked  = selector.is(':checked')
        ,   filter; // will hold reference to normal array
        
        if (       selector.hasClass('type-brand')) {
            filter = filterBrands;
        } else if (selector.hasClass('type-sae')) {
            filter = filterSaes;
        } else if (selector.hasClass('type-poly')) {
            if ($('input.type-poly:checkbox').prop('checked')) {
                $('input[name=poly]:radio').prop('disabled', false);
                allPolyCounters.parent().removeClass('disabled');
            } else {
                $('input[name=poly]:radio').prop('disabled', true);
                allPolyCounters.parent().addClass('disabled');
            }
            filter = [];
        } else if (selector.hasClass('type-clean')) {
            if ($('input.type-clean:checkbox').prop('checked')) {
                $('input[name=clean]:radio').prop('disabled', false);
                allCleanCounters.parent().removeClass('disabled');
            } else {
                $('input[name=clean]:radio').prop('disabled', true);
                allCleanCounters.parent().addClass('disabled');
            }
            filter = [];
        } else {
            filter = [];
        }

        if (isCheckbox) {
            if (isChecked) {
                filter.push(selector.val());
            } else if (filter.indexOf(selector.val()) !== -1) {
                remove(filter, filter.indexOf(selector.val()));
            }
        } else {
            // http://stackoverflow.com/a/1232046
            filter.length = 0;
        }

        if (debug) {
            console.log(filterBrands);
            console.log(filterSaes);
        }

        _makeDbUsingFilters();
        App.rebuildResults();
        App.updateCounters();
        
        if (debug) {
            console.log(((new Date()).getTime() - timer) +' ms');
        }
    };
    
    App.rebuildResults = function() {
        
        // nothing selected
        var isNothing = (!filterBrands.length && !filterSaes.length && !_filterPolyEnabled() && !_filterCleanEnabled()) ? true : false;
        
        if (isNothing) {
            $('#results').html('');
        }
        
        if (isNothing) {
            return;
        }
        
        var i, h = '';
        
        for (i in filteredDb) {
            h+= _makeResultItem(filteredDb[i]);
        }
        
        $('#results').html(h);
    };
    
    App.updateCounters = function() {
        var i;
        
        allBrandCounters.html('');
        allBrandCounters.prev().addClass('disabled');
        for (i in filteredCounters['brand']) {
            allBrandCounters.filter('[value="'+ i +'"]').html(filteredCounters['brand'][i].counter).prev().removeClass('disabled');
        }
        
        allSaeCounters.html('');
        allSaeCounters.prev().addClass('disabled');
        for (i in filteredCounters['sae']) {
            allSaeCounters.filter('[value="'+ i +'"]').html(filteredCounters['sae'][i].counter).prev().removeClass('disabled');
        }
        
        allPolyCounters.filter('[value=poly-1]').html(filteredCounters['poly'][1] || '');
        allPolyCounters.filter('[value=poly-0]').html(filteredCounters['poly'][0] || '');
        
        allCleanCounters.filter('[value=clean-1]').html(filteredCounters['clean'][1] || '');
        allCleanCounters.filter('[value=clean-0]').html(filteredCounters['clean'][0] || '');
    };
    
    _filterPolyEnabled = function() {
        return $('input.type-poly:checkbox').prop('checked') && $('input[name=poly]:radio:checked').prop('checked');
    };
    
    _filterCleanEnabled = function() {
        return $('input.type-clean:checkbox').prop('checked') && $('input[name=clean]:radio:checked').prop('checked');
    };
    
    _makeDbUsingFilters = function() {
        var i, fDb = [];
        
        filteredCounters = {
            'brand': {}
        ,   'sae': {}
        ,   'poly': {0: 0, 1: 0}
        ,   'clean': {0: 0, 1: 0}
        };
        
        var usePoly = _filterPolyEnabled()
        ,   polyValue = parseInt($('input[name=poly]:radio:checked').val())
        ,   useClean = _filterCleanEnabled()
        ,   cleanValue = parseInt($('input[name=clean]:radio:checked').val());
        
        for (i in db) {
            
            // quick filter, so will be first
            if (usePoly && db[i].poly !== polyValue) {
                continue;
            }
            
            // quick filter, so will be first
            if (useClean && (db[i].clean || 0) !== cleanValue) {
                continue;
            }
            
            if (filterBrands.length && filterBrands.indexOf(db[i].brand) < 0) {
                continue;
            }
            
            if (filterSaes.length && filterSaes.indexOf(db[i].sae) < 0) {
                continue;
            }
            
            fDb.push(db[i]);
            
            filteredCounters['brand'][db[i].brand] ? filteredCounters['brand'][db[i].brand].counter++ : filteredCounters['brand'][db[i].brand] = {counter: 1};
            filteredCounters['sae'][db[i].sae]     ? filteredCounters['sae'][db[i].sae].counter++     : filteredCounters['sae'][db[i].sae] = {counter: 1};
            filteredCounters['poly'][db[i].poly]++;
            filteredCounters['clean'][db[i].clean || 0]++;
        }
        
        $('#notes').html('&nbsp;Нашлось: '+ fDb.length);
        
        filteredDb = fDb;
    };
    
    _makeResultItem = function(item) {
        var h = '';
        
        h+= '<div class="result-item">';
        
        h+= '<h3>';
        h+= '<span class="color-brand">'+ item.brand +'</span> '+ item.product +' <span class="color-sae">'+ item.sae.replace('w', 'W-') +'</span>';
        if (item.chemical) {
            h+= '&nbsp;&nbsp;&nbsp;<span class="link blue chemical" dbid="'+ item.id +'">Анализ</span>';
        }
        if (item.links) {
            for (var i in item.links) {
                h+= '&nbsp;&nbsp;&nbsp;<a href="'+ item.links[i].href +'" onclick="window.open(this.href); return false;">'+ item.links[i].title +'</a>';
            }
        }
        h+= '</h3>';
        
        h+= '<p'+ (item.poly ? ' class="red"' : '') +'>'+ item.text +'</p>';
        
        h+= '<img src="'+ item.img +'" />';
        
        h+= '</div>';
        
        return h;
    };
    
    _uncheckGroup = function(trigger) {
        trigger.parents('div.group').find('input.filter:checked').prop('checked', false);
        
        if (trigger.parents('div.group').attr('id') === 'tag') {
            $('input[name=poly]:radio').prop('checked', false).prop('disabled', true);
            allPolyCounters.parent().addClass('disabled');
            
            $('input[name=clean]:radio').prop('checked', false).prop('disabled', true);
            allCleanCounters.parent().addClass('disabled');
        }
        
        _updateFilters(trigger);
    };
    
    
    
    
    
    // http://stackoverflow.com/a/11455508
    unique = function(a) {
        return $.grep(a, function(el, index) {
            return index === $.inArray(el, a);
        });
    };
    
    // http://www.falsepositives.com/index.php/2009/12/01/javascript-function-to-get-the-intersect-of-2-arrays/
    intersect = function(arr1, arr2) {
        var temp = [];
        for(var i = 0; i < arr1.length; i++){
            for(var k = 0; k < arr2.length; k++){
                if(arr1[i] == arr2[k]){
                    temp.push(arr1[i]);
                    break;
                }
            }
        }
        return temp;
    };
    
    // Array Remove - By John Resig (MIT Licensed)
    remove = function(array, from, to) {
        var rest = array.slice((to || from) + 1 || array.length);
        array.length = from < 0 ? array.length + from : from;
        return array.push.apply(array, rest);
    };
    
    // http://stackoverflow.com/a/14599441
    naturalSort = function(a, b) {
        return +/\d+/.exec(a)[0] > +/\d+/.exec(b)[0];
    };
    
    // http://my.opera.com/GreyWyvern/blog/show.dml/1671288
    function alphanum(a, b) {
        function chunkify(t) {
            var tz = [], x = 0, y = -1, n = 0, i, j;

            while (i = (j = t.charAt(x++)).charCodeAt(0)) {
                var m = (i == 46 || (i >=48 && i <= 57));
                if (m !== n) {
                    tz[++y] = "";
                    n = m;
                }
                tz[y] += j;
            }
            return tz;
        }

        var aa = chunkify(a);
        var bb = chunkify(b);

        for (var x = 0; aa[x] && bb[x]; x++) {
            if (aa[x] !== bb[x]) {
                var c = Number(aa[x]), d = Number(bb[x]);
                if (c == aa[x] && d == bb[x]) {
                    return c - d;
                } else return (aa[x] > bb[x]) ? 1 : -1;
            }
        }
        return aa.length - bb.length;
    }

    return App;
};

window.App = App();
    
}(window));

$(document).ready(function() {
    App.init();
});
