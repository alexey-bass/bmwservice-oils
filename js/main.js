/**
 * @author Alexey Bass @alexey_bass
 * @copyright 2013
 */

(function(window, undefined) {
    
function App() {

    var _debug = false;

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
    ,   filteredDb = [], filteredCounters
    ,   allBrandCounters, allSaeCounters, allPolyCounters, allCleanCounters, allChemicalCounters, allSynthCounters;

    _loadDb = function() {
        $.ajax({
            dataType: 'json'
        ,   url: 'db.json'
        ,   cache : false
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
        allBrandCounters    = $('input.type-brand:checkbox ~ span.counter');
        allSaeCounters      = $('input.type-sae:checkbox ~ span.counter');
        allPolyCounters     = $('input.type-poly:radio ~ span.counter');
        allCleanCounters    = $('input.type-clean:radio ~ span.counter');
        allChemicalCounters = $('input.type-chemical:checkbox ~ span.counter');
        allSynthCounters    = $('input.type-synth:checkbox ~ span.counter');
        
        _makeDbUsingFilters();
        App.updateCounters();
    };
    
    _populateDiv = function(id, data) {
        var i, h = '';
        
        h+= '<div class="header">';
        switch (id) {
            case 'sae':
                h+= '<span class="title">SAE</span>';
                break;
                
            case 'brand':
                h+= '<span class="title">Бренды</span>';
                break;
                
            case 'tag':
                h+= '<span class="title">Фильтры</span>';
                break;
        }
        h+= '<span class="link float-right select-none type-'+ id +'" title="Снять все галочки">Очистить</span>';
        h+= '</div>';
        
        h+= '<ul class="clear">';
        switch (id) {
            case 'tag':
                h+= '<li>';
                h+= '<label>';
                h+= '<input type="checkbox" class="filter type-poly" value="">';
                h+= ' <span class="color-'+ id +'">полимеризация</span>';
                h+= '</label>';
                h+= '</li>';
                h+= '<li class="color-'+ id +' poly-row">';
                h+= '<label class="disabled">';
                h+= '<input type="radio" name="poly" class="filter type-poly" value="1" disabled="disabled">';
                h+= ' <span class="label">да</span>';
                h+= ' <span class="counter" value="poly-1"></span>';
                h+= '</label>';
                h+= '<br/>';
                h+= '<label class="disabled">';
                h+= '<input type="radio" name="poly" class="filter type-poly" value="0"  disabled="disabled">';
                h+= ' <span class="label">нет</span>';
                h+= ' <span class="counter" value="poly-0"></span>';
                h+= '</label>';
                h+= '</li>';

                h+= '<li>';
                h+= '<label>';
                h+= '<input type="checkbox" class="filter type-clean" value="">';
                h+= ' <span class="color-'+ id +'">чистый результат</span>';
                h+= '</label>';
                h+= '</li>';
                h+= '<li class="color-'+ id +' clean-row">';
                h+= '<label class="disabled">';
                h+= '<input type="radio" name="clean" class="filter type-clean" value="1" disabled="disabled">';
                h+= ' <span class="label">да</span>';
                h+= ' <span class="counter" value="clean-1"></span>';
                h+= '</label>';
                h+= '<br/>';
                h+= '<label class="disabled">';
                h+= '<input type="radio" name="clean" class="filter type-clean" value="0"  disabled="disabled">';
                h+= ' <span class="label">нет</span>';
                h+= ' <span class="counter" value="clean-0"></span>';
                h+= '</label>';
                h+= '</li>';

                h+= '<li>';
                h+= '<label>';
                h+= '<input type="checkbox" class="filter type-chemical" value="">';
                h+= ' <span class="color-'+ id +'" title="Есть результат из лаборатории">хим. анализ</span>';
                h+= ' <span class="counter" value="chemical-1"></span>';
                h+= '</label>';
                h+= '</li>';
                
                h+= '<li>';
                h+= '<label>';
                h+= '<input type="checkbox" class="filter type-synth" value="">';
                h+= ' <span class="color-'+ id +'" title="Скрыть минеральные и полусинтетику">синтетика</span>';
                h+= ' <span class="counter" value="synth"></span>';
                h+= '</label>';
                h+= '</li>';
                break;
                
            default:
                for (i in data) {
                    h+= '<li>';
                    h+= '<label>';
                    h+= '<input type="checkbox" class="filter type-'+ id +'" value="'+ data[i] +'">';
                    h+= ' <span class="label color-'+ id +'">';
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
            break;
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
        
        $(document).on('click', '#show-all', function() {
            App.rebuildResults(true);
        });
    };
    
    var _chemicalHtmlTemplate = '<html><head>'
        + '<meta charset="utf-8"><title>%TITLE%</title>'
        + '<link rel="stylesheet" href="css/normalize.css"><style>body{margin:0;padding:0;font-size:10pt}</style></head>'
        + '<body>'
        + '<div style="padding: 0 10px">'
        + '<p>%TEXT%</p>'
        + '<p style="font-size:7pt">'
        + 'Внимание: для определения щёлочности используется не ASTM-D2896, а более близкий к нашему ГОСТ - ASTM D4739, который дает около 15% занижения щелочного числа. Следовательно, показатели TBN несколько занижены относительно паспортных.'
        + '<br/>Исследование в закрытом тигле обычно производится для легких нефтепродуктов - этот тест пропорционально занижает точку вспышки на величину около 20 градусов.'
        + '<p>'
        + '</div>'
        + '<div><img src="%IMG%" alt="" /></div>'
        + '</body></html>';
    
    _openChemicalWindow = function(trigger) {
        var id = trigger.attr('dbid'), item = _getDbItemById(id)
        ,   win = window.open('', '_blank', 'menubar=no,location=no,resizable=yes,scrollbars=yes,status=no,height=900,width=820');
        
        var html = _chemicalHtmlTemplate;
        html = html.replace('%TITLE%', item.brand +' '+ item.product +' SAE&nbsp;'+ item.sae.replace('w', 'W-'));
        html = html.replace('%TEXT%',  item.chemical.text);
        html = html.replace('%IMG%',   item.chemical.img);
        
        win.document.write(html);
    };
    
    _getDbItemById = function(id) {
        return db[id - 1];
    };
    
    _updateFilters = function(selector) {
        if (_debug) {
            var timer = (new Date()).getTime();
        }
        
        var isCheckbox = selector.is('input') // can be 'select-none' trigger
        ,   isChecked  = selector.is(':checked')
        ,   filter; // will hold reference to original data
        
        switch (selector.attr('class').match(/type-(\w+)/)[1]) {
            case 'brand':
                filter = filterBrands;
                break;
                
            case 'sae':
                filter = filterSaes;
                break;
                
            case 'poly':
                if (isCheckbox) {
                    $('input[name=poly]:radio').prop('disabled', !isChecked);
                    allPolyCounters.parent()[isChecked ? 'removeClass' : 'addClass']('disabled');
                }
                filter = [];
                break;
                
            case 'clean':
                if (isCheckbox) {
                    $('input[name=clean]:radio').prop('disabled', !isChecked);
                    allCleanCounters.parent()[isChecked ? 'removeClass' : 'addClass']('disabled');
                }
                filter = [];
                break;
                
            case 'synth':
                _disableMineralLabels(isChecked);
                filter = [];
                break;
                
            default:
                filter = [];
                break;
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

        _makeDbUsingFilters();
        App.rebuildResults();
        App.updateCounters();
        
        if (_debug) {
            console.log(((new Date()).getTime() - timer) +' ms');
        }
    };
    
    _disableMineralLabels = function(action) {
        allSaeCounters.parent().has('input[value=10w40], input[value=15w40]').children('input').prop('disabled', action);
    };
    
    App.rebuildResults = function(force) {
        
        force = force || false;
        
        // nothing selected
        var isNothing = (!force && !filterBrands.length && !filterSaes.length && !_filterPolyEnabled() && !_filterCleanEnabled()) ? true : false;
        
        if (isNothing) {
            $('#results').html('');
            $('#show-all').removeClass('hidden');
            return;
        }
        
        var i, h = '';
        
        for (i in filteredDb) {
            h+= _makeResultItem(filteredDb[i]);
        }
        
        $('#results').html(h);
        $('#show-all').addClass('hidden');
    };
    
    App.updateCounters = function() {
        var i, total;
        
        allBrandCounters.html('');
        allBrandCounters.parent().addClass('disabled');
        for (i in filteredCounters['brand']) {
            allBrandCounters.filter('[value="'+ i +'"]').html(filteredCounters['brand'][i]).parent().removeClass('disabled');
        }
        
        allSaeCounters.html('');
        allSaeCounters.parent().addClass('disabled');
        for (i in filteredCounters['sae']) {
            allSaeCounters.filter('[value="'+ i +'"]').html(filteredCounters['sae'][i]).parent().removeClass('disabled');
        }
        
        total = filteredCounters['poly'][0] + filteredCounters['poly'][1];
        allPolyCounters.filter('[value=poly-1]').html(filteredCounters['poly'][1] ? (filteredCounters['poly'][1] +' ('+ Math.round(filteredCounters['poly'][1]*100/total) +'%)') : '');
        allPolyCounters.filter('[value=poly-0]').html(filteredCounters['poly'][0] ? (filteredCounters['poly'][0] +' ('+ Math.round(filteredCounters['poly'][0]*100/total) +'%)') : '');
        
        allCleanCounters.filter('[value=clean-1]').html(filteredCounters['clean'][1] || '');
        allCleanCounters.filter('[value=clean-0]').html(filteredCounters['clean'][0] || '');
        
        allChemicalCounters.html(filteredCounters['chemical'] || '');
        
        allSynthCounters.html(filteredCounters['synth'] || '');
    };
    
    _filterPolyEnabled = function() {
        return $('input.type-poly:checkbox').prop('checked')  && $('input[name=poly]:radio:checked').prop('checked');
    };
    
    _filterCleanEnabled = function() {
        return $('input.type-clean:checkbox').prop('checked') && $('input[name=clean]:radio:checked').prop('checked');
    };
    
    _filterChemicalEnabled = function() {
        return $('input.type-chemical:checkbox').prop('checked');
    };
    
    _filterSynthEnabled = function() {
        return $('input.type-synth:checkbox').prop('checked');
    };
    
    _makeDbUsingFilters = function() {
        var i;
        
        // clean result db
        filteredDb = [];
        
        filteredCounters = {
            'brand': {}
        ,   'sae': {}
        ,   'poly': {0: 0, 1: 0}
        ,   'clean': {0: 0, 1: 0}
        ,   'chemical': 0
        ,   'synth': 0
        };
        
        var usePoly = _filterPolyEnabled()
        ,   polyValue = parseInt($('input[name=poly]:radio:checked').val())
        ,   useClean = _filterCleanEnabled()
        ,   cleanValue = parseInt($('input[name=clean]:radio:checked').val())
        ,   useChemical = _filterChemicalEnabled()
        ,   useSynth = _filterSynthEnabled();
        
        for (i in db) {
            
            // quick filter, keep on top
            if (usePoly && db[i].poly !== polyValue) {
                continue;
            }
            
            // quick filter, keep on top
            if (useClean && (db[i].clean || 0) !== cleanValue) {
                continue;
            }
            
            // quick filter, keep on top
            if (useSynth && db[i].base === 0) {
                continue;
            }
            
            if (useChemical && !db[i].chemical) {
                continue;
            }
            
            if (filterBrands.length && filterBrands.indexOf(db[i].brand) < 0) {
                continue;
            }
            
            if (filterSaes.length && filterSaes.indexOf(db[i].sae) < 0) {
                continue;
            }
            
            filteredDb.push(db[i]);
            
            filteredCounters['brand'][db[i].brand] ? filteredCounters['brand'][db[i].brand]++ : filteredCounters['brand'][db[i].brand] = 1;
            filteredCounters['sae'][db[i].sae]     ? filteredCounters['sae'][db[i].sae]++     : filteredCounters['sae'][db[i].sae] = 1;
            filteredCounters['poly'][db[i].poly]++;
            filteredCounters['clean'][db[i].clean || 0]++;
            db[i].chemical ? filteredCounters['chemical']++ : 0;
            db[i].base !== 0 ? filteredCounters['synth']++ : 0;
        }
        
        $('#notes').html('&nbsp;Нашлось: '+ filteredDb.length +'<br/>&nbsp;<span id="show-all" class="link blue hidden">Показать всё</span>');
    };
    
    _makeResultItem = function(item) {
        var h = '';
        
        h+= '<div class="result-item">';
        
        h+= '<h3>';
        h+= '<span class="color-brand">'+ item.brand +'</span> '+ item.product +' <span class="color-sae">SAE '+ item.sae.replace('w', 'W-') +'</span>';
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
            // restore poly
            $('input[name=poly]:radio').prop('checked', false).prop('disabled', true);
            allPolyCounters.parent().addClass('disabled');
            
            // restore clean
            $('input[name=clean]:radio').prop('checked', false).prop('disabled', true);
            allCleanCounters.parent().addClass('disabled');
            
            // restore mineral
            _disableMineralLabels(false);
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
