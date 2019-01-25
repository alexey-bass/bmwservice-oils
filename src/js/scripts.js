/**
 * @preserve
 * @author Alexey Bass @alexey_bass
 * @copyright 2013-2019
 */

(function(window, undefined) {

function App() {

    var _debug = false;

    /**
     * Timestamp of code init.
     * @type Number
     */
    var _initTime = 0;

    var App = {};

//    var _disqusInitialized = false;
//    var _isCommentsOpened = false;

    var imgPrefix = '//img-fotki.yandex.ru/get/'
    ,   imgSize   = 'XL'; // default

    App.init = function() {
        _initTime = new Date().getTime();
        _loadDb();

        $('#warning button').bind('click', function() {
            var timeSpent = new Date().getTime() - _initTime;
            if (timeSpent > 0) {
                gtag('event', 'timing_complete', {'name': 'Time before start', 'value': timeSpent, 'event_category': 'UX'});
            }

            $('#warning, #screen').hide();
            $('#screen').removeClass('hidden').fadeIn(1000);
            gtag('event', 'screen_view', {'app_name': 'bmwservice-oils', 'screen_name' : 'Main'});
            _updateHeight();
        });

        $(window).resize(_updateHeight);

        // hide from handheld devices and small
//        if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
//            $('#comments').on('click', function() {
//                if (!_disqusInitialized) {
//                    _disqusInitialized = true;
//                    var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
//                    dsq.src = '//' + 'bmwservice-oils' + '.disqus.com/embed.js';
//                    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
//                    _gaq.push(['_trackTiming', 'UX', 'Comments activated', new Date().getTime() - _initTime]);
//                }
//
//                if (_isCommentsOpened) {
//                    $('#disqus_thread').slideUp();
//                    $('#comments').removeClass('opened');
//                    $('#comments .hint').hide();
//                    _gaq.push(['_trackEvent', 'UX', 'Comments hide']);
//                } else {
//                    $('#disqus_thread').slideDown();
//                    $('#comments').addClass('opened');
//                    $('#comments .hint').fadeIn(200);
//                    _gaq.push(['_trackEvent', 'UX', 'Comments show']);
//                }
//                _isCommentsOpened = !_isCommentsOpened;
//            }).hide().removeClass('hidden').delay(1000).fadeIn();
//        }

//        _loadSharingWidget();
    };

//    _loadSharingWidget = function() {
//        if (window.addthis) {
//            window.addthis = null;
//        }
//        var addthis_config = {
//            pubid: 'ra-53fcf85b50b78671'
//        };
//        $.getScript('//s7.addthis.com/js/300/addthis_widget.js#domready=1', function() {
//            addthis.init();
//            addthis.addEventListener('addthis.ready',      _addthisHandler);
//            addthis.addEventListener('addthis.menu.share', _addthisHandler);
//        });
//    };

    _updateHeight = function() {
        var h = $(window).height();
        if (h > 450) {
            $('#brand ul').height(h - 43);
        }
    };

    _detectBestImgSize = function() {
        var max = Math.max($(window).height(), $(window).width());

        /**
         * We do not force XXL, only if user wants to. So only 3 options automatically set.
         *
         * Left pane (filters) is 300px wide.
         * Image sizes:
         *   M =  300 px
         *   L =  500
         *  XL =  800
         * XXL = 1000
         */

        if (max < 700) {
            imgSize = 'M';
        } else if (max < 900) {
            imgSize = 'L';
        } else {
            imgSize = 'XL'; // default
        }

        $('input[name="image-size"][value='+ imgSize +']').prop('checked', true);
    };

    var db
    ,   filterBrands = [], filterSaes = []
    ,   filteredDb = [], filteredCounters
    ,   allBrandCounters, allSaeCounters, allPolyCounters, allCleanCounters, allChemicalCounters, allSynthCounters, allSeasonCounters;

    _loadDb = function() {
        var startTime = new Date().getTime()
        ,   mainSrc = $('body script[src*="scripts"]').attr('src');

        var dateStamp = mainSrc.replace(/^.+\?/, '') // 'js/main.js?140907' > '140907'
        ,   fileName = (mainSrc.indexOf('.min.') !== -1) ? 'db.min.json' : 'db.json';

        $.ajax({
            dataType: 'json'
        ,   url: fileName +'?'+ dateStamp
        ,   cache : true
        ,   success: function(data) {
                var timeSpent = new Date().getTime() - startTime;
                if (timeSpent > 0) {
                    gtag('event', 'timing_complete', {'name': 'DB loaded', 'value': timeSpent, 'event_category': 'Resources'});
                }
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
            brands.push(data[i].brd);
            saes.push(data[i].sae);
        }

        brands = unique(brands).sort();
        saes = unique(saes).sort(alphanum);

        _populateDiv('brand', brands);
        _populateDiv('sae',   saes);
        _populateDiv('tag');
        _populateDiv('size');

        _attachHandlers();
        _detectBestImgSize();
    };

    _postInit = function() {
        allBrandCounters      = $('input.type-brand:checkbox ~ span.counter');
        allSaeCounters        = $('input.type-sae:checkbox ~ span.counter');
        allPolyCounters       = $('input.type-poly:radio ~ span.counter');
        allCleanCounters      = $('input.type-clean:radio ~ span.counter');
        allSeasonCounters     = $('input.type-season:radio ~ span.counter');
        allChemicalCounters   = $('input.type-chemical:checkbox ~ span.counter');
        allBmwserviceCounters = $('input.type-bmwservice:checkbox ~ span.counter');
        allSynthCounters      = $('input.type-synth:checkbox ~ span.counter');

        _makeDbUsingFilters();
        App.updateCounters();

        // help smartphone users
        $('#sae .header .title').on('click', function() {
            $('#sae ul').slideToggle();
        });
    };

    _populateDiv = function(id, data) {
        var i, h = '';

        h+= '<div class="header">';
        h+= '<span class="title">';
        switch (id) {
            case 'brand':
                h+= 'Бренды';
                break;

            case 'sae':
                h+= 'SAE';
                break;

            case 'tag':
                h+= 'Фильтры';
                break;

            case 'size':
                h+= 'Картинки';
                break;
        }
        h+= '</span>';
        if (id !== 'size') {
            h+= '<span class="link float-right select-none type-'+ id +'" title="Снять все галочки">Очистить</span>';
        }
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

                h+= '<li>';
                h+= '<label>';
                h+= '<input type="checkbox" class="filter type-bmwservice" value="">';
                h+= ' <span class="color-'+ id +'" title="Рекомендованные моторные масла bmwservice">bmwservice</span>';
                h+= ' <span class="counter" value="bmwservice"></span>';
                h+= '</label>';
                h+= '</li>';

                h+= '<li>';
                    h+= '<label title="Сезон прожарки">';
                        h+= '<input type="checkbox" class="filter type-season" value="">';
                        h+= ' <span class="color-'+ id +'">сезон</span>';
                    h+= '</label>';
                h+= '</li>';
                h+= '<li class="color-'+ id +' season-row">';
                    h+= '<label class="disabled">';
                        h+= '<input type="radio" name="season" class="filter type-season" value="1" disabled="disabled">';
                        h+= ' <span class="label" >1 (2013)</span>';
                        h+= ' <span class="counter" value="season-1"></span>';
                    h+= '</label>';
                    h+= '<br/>';
                    h+= '<label class="disabled">';
                        h+= '<input type="radio" name="season" class="filter type-season" value="2"  disabled="disabled">';
                        h+= ' <span class="label">2 (2019, скоро!)</span>';
                        h+= ' <span class="counter" value="season-2"></span>';
                    h+= '</label>';
                h+= '</li>';
                break;

            case 'size':
                h+= '<label title="быстро грузятся на смартфоне"><input type="radio" name="image-size" value="M" /> маленькие</label><br/>';
                h+= '<label><input type="radio" name="image-size" value="L" /> средние</label><br/>';
                h+= '<label><input type="radio" name="image-size" value="XL" /> большие</label><br/>';
                h+= '<label title="хороши для просмотра на широкоформатных мониторах"><input type="radio" name="image-size" value="XXL"> ещё больше</label><br/>';
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
            gtag('event', 'Show all', {'event_category': 'UX'});
            App.rebuildResults(true);
        });

        $('input[name="image-size"]').on('change', function() {
            imgSize = _getImageSize();
            gtag('event', 'Image size', {'event_category': 'UX', 'event_label': imgSize});
            App.rebuildResults(true);
        });

        if (typeof addthis !== 'undefined') {
            addthis.addEventListener('addthis.ready',      _addthisHandler);
            addthis.addEventListener('addthis.menu.share', _addthisHandler);
        }
    };

    var _socialSharesCounter = 0;

    _addthisHandler = function(e) {
        var timeSpent = new Date().getTime() - _initTime;

        switch (e.type) {
            case 'addthis.ready':
                gtag('event', 'timing_complete', {'name': 'AddThis ready', 'value': timeSpent, 'event_category': 'Resources'});
                break;

            case 'addthis.menu.share':
                gtag('event', 'share', {'event_category': 'social', 'event_label': e.data.service, 'value': ++_socialSharesCounter});
                gtag('event', 'timing_complete', {'name': 'Time before pressed share', 'value': timeSpent, 'event_category': 'UX', 'event_label': e.data.service});
                break;
        }
    };

    _getImageSize = function() {
        return $('input[name="image-size"]:checked').val();
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

        var title = item.brd +' '+ item.prd +' SAE '+ item.sae.replace('w', 'W-');
        gtag('event', 'Open chemical report', {'event_category': 'UX', 'event_label': title});

        var html = _chemicalHtmlTemplate;
        html = html.replace('%TITLE%', title);
        html = html.replace('%TEXT%',  item.chm.txt);
        html = html.replace('%IMG%',   imgPrefix + item.chm.img +'_XXL');

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
        ,   isRadio    = selector.is('[type=radio]')
        ,   isChecked  = selector.is(':checked')
        ,   filter; // will hold reference to original data

        switch (selector.attr('class').match(/type-(\w+)/)[1]) {
            case 'brand':
                if (isCheckbox) {
                    gtag('event', (isChecked ? 'S' : 'Uns') +'elect brand', {'event_category': 'UX', 'event_label': selector.val()});
                }
                filter = filterBrands;
                break;

            case 'sae':
                if (isCheckbox) {
                    gtag('event', (isChecked ? 'S' : 'Uns') +'elect SAE', {'event_category': 'UX', 'event_label': selector.val()});
                }
                filter = filterSaes;
                break;

            case 'poly':
                if (isCheckbox) {
                    if (!isRadio) { // filter
                        gtag('event', 'Filter poly', {'event_category': 'UX', 'event_label': (isChecked ? 'Enabled' : 'Disabled')});
                    } else { // option
                        gtag('event', 'Filter poly', {'event_category': 'UX', 'event_label': (parseInt(selector.val()) ? 'Yes' : 'No')});
                    }

                    $('input[name=poly]:radio').prop('disabled', !isChecked);
                    allPolyCounters.parent()[isChecked ? 'removeClass' : 'addClass']('disabled');
                }
                filter = [];
                break;

            case 'clean':
                if (isCheckbox) {
                    if (!isRadio) { // filter
                        gtag('event', 'Filter clean result', {'event_category': 'UX', 'event_label': (isChecked ? 'Enabled' : 'Disabled')});
                    } else { // option
                        gtag('event', 'Filter clean result', {'event_category': 'UX', 'event_label': (parseInt(selector.val()) ? 'Yes' : 'No')});
                    }

                    $('input[name=clean]:radio').prop('disabled', !isChecked);
                    allCleanCounters.parent()[isChecked ? 'removeClass' : 'addClass']('disabled');
                }
                filter = [];
                break;

            case 'season':
                if (isCheckbox) {
                    if (!isRadio) { // filter
                        gtag('event', 'Filter season result', {'event_category': 'UX', 'event_label': (isChecked ? 'Enabled' : 'Disabled')});
                    } else { // option
                        gtag('event', 'Filter season result', {'event_category': 'UX', 'event_label': parseInt(selector.val())});
                    }

                    $('input[name=season]:radio').prop('disabled', !isChecked);
                    allSeasonCounters.parent()[isChecked ? 'removeClass' : 'addClass']('disabled');
                }
                filter = [];
                break;

            case 'synth':
                gtag('event', 'Filter synt only', {'event_category': 'UX', 'event_label': (isChecked ? 'Enabled' : 'Disabled')});
                _disableMineralLabels(isChecked);
                filter = [];
                break;

            case 'chemical':
                gtag('event', 'Filter has chemical result', {'event_category': 'UX', 'event_label': (isChecked ? 'Enabled' : 'Disabled')});
                filter = [];
                break;

            case 'bmwservice':
                gtag('event', 'Filter bmwservice recommended', {'event_category': 'UX', 'event_label': (isChecked ? 'Enabled' : 'Disabled')});
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
        var isNothing = (!force
            && !filterBrands.length
            && !filterSaes.length
            && !_filterPolyEnabled()
            && !_filterCleanEnabled()
            && !_filterSeasonEnabled()) ? true : false;

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

        allSeasonCounters.filter('[value=season-1]').html(filteredCounters['season'][1] || '');
        allSeasonCounters.filter('[value=season-2]').html(filteredCounters['season'][2] || '');

        allChemicalCounters.html(filteredCounters['chemical'] || '');

        allBmwserviceCounters.html(filteredCounters['bmwservice'] || '');

        allSynthCounters.html(filteredCounters['synth'] || '');
    };

    _filterPolyEnabled = function() {
        return $('input.type-poly:checkbox').prop('checked')  && $('input[name=poly]:radio:checked').prop('checked');
    };

    _filterCleanEnabled = function() {
        return $('input.type-clean:checkbox').prop('checked') && $('input[name=clean]:radio:checked').prop('checked');
    };

    _filterSeasonEnabled = function() {
        return $('input.type-season:checkbox').prop('checked') && $('input[name=season]:radio:checked').prop('checked');
    };

    _filterChemicalEnabled = function() {
        return $('input.type-chemical:checkbox').prop('checked');
    };

    _filterBmwserviceEnabled = function() {
        return $('input.type-bmwservice:checkbox').prop('checked');
    };

    _filterSynthEnabled = function() {
        return $('input.type-synth:checkbox').prop('checked');
    };

    _makeDbUsingFilters = function() {
        var i;

        // clean result db
        filteredDb = [];

        filteredCounters = {
            'brand':     {}
        ,   'sae':       {}
        ,   'poly':      {0: 0, 1: 0}
        ,   'clean':     {0: 0, 1: 0}
        ,   'season':    {1: 0, 2: 0}
        ,   'chemical':   0
        ,   'bmwservice': 0
        ,   'synth':      0
        };

        var usePoly = _filterPolyEnabled()
        ,   polyValue = parseInt($('input[name=poly]:radio:checked').val())
        ,   useClean = _filterCleanEnabled()
        ,   cleanValue = parseInt($('input[name=clean]:radio:checked').val())
        ,   useSeason = _filterSeasonEnabled()
        ,   seasonValue = parseInt($('input[name=season]:radio:checked').val())
        ,   useChemical = _filterChemicalEnabled()
        ,   useBmwservice = _filterBmwserviceEnabled()
        ,   useSynth = _filterSynthEnabled();

        for (i in db) {

            // quick filter, keep on top
            if (usePoly && (db[i].ply || 0) !== polyValue) {
                continue;
            }

            // quick filter, keep on top
            if (useClean && (db[i].cln || 0) !== cleanValue) {
                continue;
            }

            // quick filter, keep on top
            if (useSeason && (db[i].ssn || 1) !== seasonValue) {
                continue;
            }

            // quick filter, keep on top
            if (useSynth && db[i].syn === 0) {
                continue;
            }

            if (useChemical && !db[i].chm) {
                continue;
            }

            if (useBmwservice && !db[i].rbs) {
                continue;
            }

            if (filterBrands.length && filterBrands.indexOf(db[i].brd) < 0) {
                continue;
            }

            if (filterSaes.length && filterSaes.indexOf(db[i].sae) < 0) {
                continue;
            }

            filteredDb.push(db[i]);

            filteredCounters['brand'][db[i].brd] ? filteredCounters['brand'][db[i].brd]++ : filteredCounters['brand'][db[i].brd] = 1;
            filteredCounters['sae'][db[i].sae]   ? filteredCounters['sae'][db[i].sae]++   : filteredCounters['sae'][db[i].sae]   = 1;
            filteredCounters['poly'][(db[i].ply || 0)]++;
            filteredCounters['clean'][(db[i].cln || 0)]++;
            filteredCounters['season'][(db[i].ssn || 1)]++;
            db[i].chm       ? filteredCounters['chemical']++   : 0;
            db[i].rbs       ? filteredCounters['bmwservice']++ : 0;
            db[i].syn !== 0 ? filteredCounters['synth']++      : 0;
        }

        $('#notes').html('&nbsp;Нашлось: '+ filteredDb.length +'<br/>&nbsp;<span id="show-all" class="link blue hidden">Показать</span>');
    };

    _makeResultItem = function(item) {
        var h = '';

        h+= '<div class="result-item">';

        h+= '<h3>';
        h+= '<span class="color-brand">'+ item.brd +'</span> '+ item.prd +' <span class="color-sae">SAE '+ item.sae.replace('w', 'W-') +'</span>';
        if (item.chm) {
            h+= '&nbsp;&nbsp;&nbsp;<span class="link blue chemical" dbid="'+ item.id +'">Анализ</span>';
        }
        if (item.links) {
            for (var i in item.links) {
                h+= '&nbsp;&nbsp;&nbsp;<a href="'+ item.links[i].hrf +'" onclick="window.open(this.href); return false;">'+ item.links[i].ttl +'</a>';
            }
        }
        h+= '</h3>';

        h+= '<p>'+ item.txt +'</p>';

        h+= '<img src="'+ imgPrefix + item.img +'_'+ imgSize+ '" />';

        h+= '</div>';

        return h;
    };

    _uncheckGroup = function(trigger) {
        var category = trigger.parents('div.group').attr('id');

        gtag('event', 'Clear all', {'event_category': 'UX', 'event_label': category});

        trigger.parents('div.group').find('input.filter:checked').prop('checked', false);

        if (category === 'tag') {
            // restore poly
            $('input[name=poly]:radio').prop('checked', false).prop('disabled', true);
            allPolyCounters.parent().addClass('disabled');

            // restore clean
            $('input[name=clean]:radio').prop('checked', false).prop('disabled', true);
            allCleanCounters.parent().addClass('disabled');

            // restore season
            $('input[name=season]:radio').prop('checked', false).prop('disabled', true);
            allSeasonCounters.parent().addClass('disabled');

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
}

window.App = App();

}(window));

$(document).ready(function() {
    App.init();
});
