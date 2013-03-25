(function(window, undefined) {
    
function App() {

    var App = {};
    
//    Array.prototype.unique = Array.prototype.unique || function() {
//        
//    };

    App.init = function() {
        loadDb();
    };

    var db
    ,   filterBrands = [], filterSaes = [], filterTags = []
    ,   debug = false;

    loadDb = function() {
        $.ajax({
            dataType: "json"
        ,   url: "db.json"
        ,   success: function(data) {
                db = data;
                populateSelectors(data);
            }
        });
    };
    
    populateSelectors = function(data) {
        var i, brands = [], saes = [], tags = [];
        
        for (i in data) {
            brands.push(data[i].brand);
            saes.push(data[i].sae);
            tags = tags.concat(data[i].tags);
        }
        
        brands = unique(brands).sort();
        saes = unique(saes).sort();
        tags = unique(tags).sort();
        
        populateDiv('brand', brands);
        populateDiv('sae',   saes);
        populateDiv('tag',   tags);
        
        attachHandlers();
    };
    
    populateDiv = function(id, data) {
        var i, h = '';
        
//        h+= '<p>';
//        h+= '<label><input type="radio" name="logic-'+ id +'" checked="checked"> Включить</span><br/>';
//        h+= '<label><input type="radio" name="logic-'+ id +'"> Исключить</span>';
//        h+= '</p>';
        
        h+= '<p class="control">';
//        h+= '<span class="link select-all">Все</span>';
        h+= ' <span class="link select-none" title="Снять все галочки">Очистить</span>';
        h+= '</p>';
        
        h+= '<ul>';
        for (i in data) {
            h+= '<li>';
            h+= '<label>';
            h+= '<input type="checkbox" class="filter type-'+ id +'" value="'+ data[i] +'"> ';
            h+= '<span class="color-'+ id +'">';
            switch (id) {
                case 'sae':
                    h+= data[i].replace('w', 'w-');
                    break;
                    
                default:
                    h+= data[i];
            }
            h+= '</span>';
            h+= '</label>';
            h+= '</li>';
        }
        h+= '</ul>';
        
        $('#'+ id).html(h);
    };
    
    attachHandlers = function() {
        $('.filter').bind('change', function() {
            updateFilters($(this));
        });
    };
    
    var timer;
    
    updateFilters = function(selector) {
        if (debug) {
            timer = (new Date()).getTime();
        }
        
        var isChecked = selector.is(':checked'), filter;
            
        if (       selector.hasClass('type-brand')) {
            filter = filterBrands;
        } else if (selector.hasClass('type-sae')) {
            filter = filterSaes;
        } else if (selector.hasClass('type-tag')) {
            filter = filterTags;
        }

        if (isChecked) {
            filter.push(selector.val());
        } else if (filter.indexOf(selector.val()) !== -1) {
            remove(filter, filter.indexOf(selector.val()));
        }

        if (debug) {
            console.log(filterBrands);
            console.log(filterSaes);
            console.log(filterTags);
        }

        App.rebuildResults();
        
        if (debug) {
            console.log(((new Date()).getTime() - timer) +' ms');
        }
    };
    
    App.rebuildResults = function() {
        // nothing selected
        if (!filterBrands.length && !filterSaes.length && !filterTags.length) {
            $('#results').html('');
            return;
        }
        
        var i, h = '', filteredData = getDbAfterFilters();
        
        for (i in filteredData) {
            h+= makeResultItem(filteredData[i]);
        }
        
        $('#results').html(h);
    };
    
    getDbAfterFilters = function() {
        var i, filteredDb = [], common;
        
        for (i in db) {
            
            if (filterBrands.length && filterBrands.indexOf(db[i].brand) < 0) {
                continue;
            }
            
            if (filterSaes.length && filterSaes.indexOf(db[i].sae) < 0) {
                continue;
            }
            
            if (filterTags.length) {
                common = intersect(filterTags, db[i].tags);
                if (common.length !== filterTags.length) {
                    continue;
                }
            }
            
            filteredDb.push(db[i]);
        }
        
        return filteredDb;
    };
    
    makeResultItem = function(item) {
        var h = '';
        
        h+= '<div class="result-item">';
        h+= '<h3><span class="color-brand">'+ item.brand +'</span> '+ item.product +' <span class="color-sae">'+ item.sae.replace('w', 'W-') +'</span></h3>';
        h+= '<p>'+ item.text +'</p>';
        h+= '<img src="'+ item.img +'" />';
        h+= '</div>';
        
        return h;
    };
    
    
    
    unique = function(a) {
        return $.grep(a, function(el, index) {
            return index === $.inArray(el, a);
        });
    };
    
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

    return App;
};

window.App = App();
    
}(window));

$(document).ready(function() {
    App.init();
});
