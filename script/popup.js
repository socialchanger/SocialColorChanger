var a_colors = [
    "header_color",
    "text_header_color",
    "theme_color",
    "inner_boxes_color",
    "text_color",
    "heading_color",
    "buttons_color",
    "borders_color"
];
var section_id = 0;

function changeRealtime(id, v) {
    send_msg_content({"method": "c_color", "id": id, "c": v});
}

function getValueById(c) {
    if ($("#" + c).is(':checkbox')) {
        return $("#" + c).is(':checked');
    }
    return $("#" + c).val();
}

function setValueById(c, v) {
    if (!$("#" + c)) {
        return;
    }
    if ($("#" + c).is(':checkbox')) {
        $("#" + c).attr("checked", !!v);
    } else {
        $("#" + c).val(v);
        $("#" + c).minicolors("value", v);
    }
}

function send_msg_content(json) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, json);
    });
}

function repopulateThemes() {
    chrome.storage.sync.get({
        "themes": {},
        "isOn": true,
        "active_theme": "My Template",
        "rated": false
    }, function (items) {
        $("#enable_color")
            .prop('checked',
                items["isOn"]).change();
        populateThemes(items["themes"] || {}, items["active_theme"]);


    });
}

function showMessage(x, gb) {
    var tm = $("#txt_msg");
    tm.text(x);
    tm.show(500);
    setTimeout(function () {
        tm.hide(500);
        if (gb) {
            repopulateThemes();
            setTimeout(function () {
                goBack()
            }, 100);
        }
    }, 1000);
}

function setTheme(items, name) {
    if (name) {
        $("#theme_name").val(name);
        $("#old_theme_name").val(name);
    }
    a_colors.forEach(function (c) {
        setValueById(c, items[c] || "");
    });
}

function populateThemes(themes, active_theme) {
    var tl = document.getElementById("templatesList");
    tl.innerHTML = "";

    for (var i in themes) {
        themeL.add(i, themes[i], i == active_theme, "");
    }

    for (var i in default_themes) {
        themeL.add(i, default_themes[i], i == active_theme, "p");
    }
    document.querySelector("body").classList.remove("hidden");
}

function goBack() {
    section_id = 0;
    document.querySelector("body").removeAttribute("id");
}

function save(d) {
    var colors = {},
        name = $("#theme_name").val();

    a_colors.forEach(function (c) {
        colors[c] = getValueById(c)
    });
    chrome.storage.sync.get(
        {"themes": {}},
        function (items) {

            if (d) {
                delete(items["themes"][$("#old_theme_name").val()]);
            }
            items["themes"][name] = colors;
            chrome.storage.sync.set({"themes": items["themes"], "active_theme": name}, function (items) {
                showMessage("Theme saved", 1);
            });
        });
}


function go() {
    $("input.minicolors-input").minicolors({
        change: function (value, opacity) {
            changeRealtime(this.id, value);
        },
        theme: 'bootstrap'
    });

    $("#hide_border").change(function () {
        changeRealtime(this.id, getValueById(this.id));
    });

    $("#enable_color").change(function () {
        var isOn = $("#enable_color").is(':checked');
        chrome.storage.sync.set({"isOn": isOn});
        send_msg_content({"method": "c_on", "id": "isOn", "c": isOn});
    });

    $(".sharerate").click(function () {
        chrome.storage.sync.set({"rated": true});
    });

    $("#save_theme").click(function () {
        save(1);
    });

    $("#savenew_theme").click(function () {
        save(0);
    });

    $("#cancel_theme").click(function () {
        goBack();
    });

    $("#export").click(function () {
        chrome.storage.sync.get({"themes": {}}, function (items) {
            alertify.alert(JSON.stringify(items));
        });
    });

    $("#templatesList").mouseleave(function () {
        if (!section_id) {
            chrome.storage.sync.get({"themes": {}, "active_theme": "My Template"}, function (items) {
                setTheme(items["themes"][items["active_theme"]] || default_themes[items["active_theme"]] || {});
            });
        }
    });

    $("#create_theme").click(function () {
        themeL.create();
    });

    repopulateThemes();
    section_id = 0;
}

var themeL = {
    add: function (name, theme, act, themep) {
        var tl = document.getElementById("templatesList");
        var t = document.getElementById("theme" + themep);
        var c = t.content.childNodes[1].cloneNode(true);

        c.querySelector(".txt").innerText = name;
        c.setAttribute("data-wordset_id", name);

        if (act) {
            $(c).addClass("activeT");
        }

        tl.appendChild(c);

        $(c).mouseenter(function () {
            if (!section_id) {
                setTheme(theme);
            }
        });

        c.addEventListener('click', function () {
            $("#templatesList .activeT").removeClass("activeT");
            $(c).addClass("activeT");
            themeL.setActive(theme, name);
        }, false);

        c.querySelector('.edit').addEventListener('click', function (evt) {
            evt.preventDefault();
            themeL.edit(name);
        }, false);


        var closeb = c.querySelector('.x');
        if (closeb) {
            closeb.addEventListener('click', function (evt) {
                var t = this;
                alertify.theme("color").okBtn("Delete").cancelBtn("Cancel").confirm("Are you sure that you want to delete <b>" + name + "</b>?", function () {
                    themeL.delNow(evt, t)
                });
            }, false);
        }
    },

    delNow: function (evt, that) {
        evt.stopPropagation();
        evt.preventDefault();

        var target = that;
        var tagName = that.tagName;
        while (target && tagName != 'LI') {
            target = target.parentNode;
            tagName = target.tagName;
        }

        if (!target) {
            return;
        }

        var parent = target.parentNode;
        parent.removeChild(target);

        var name = target.getAttribute("data-wordset_id");

        chrome.storage.sync.get({"themes": {}}, function (items) {
            delete(items["themes"][name]);
            chrome.storage.sync.set({"themes": items["themes"]});
        });
    },

    goEdit: function (ts, name) {
        setTheme(ts, name);

        var ls = document.getElementById("edit-list-screen");
        ls.setAttribute("data-wordset_id", name);

        section_id = 1;
        document.querySelector("body").setAttribute("id", "edit-list-open");
        document.querySelector("body").scrollTop = 0;

        ga('send', 'pageview', "/UI/" + name);
    },

    findName: function (items, sname) {
        var i = 1, name;
        do {
            name = sname + " " + i;
            i++;
        } while (items[name] && i < 1000);
        return name;
    },

    edit: function (name) {
        chrome.storage.sync.get({"themes": {}}, function (items) {
            var ts = items["themes"][name];
            if (!ts) {
                var ts = default_themes[name];
                if (!ts) {
                    return;
                }
                name = themeL.findName(items["themes"] || {}, name);
            }
            themeL.goEdit(ts, name);
        });
    },

    setActive: function (theme, name) {
        setTheme(theme);
        chrome.storage.sync.set({"active_theme": name});
    },

    create: function () {
        chrome.storage.sync.get({"themes": {}}, function (items) {
                themeL.goEdit({}, themeL.findName(items["themes"] || {}, "My Theme"));
            }
        )
    }
}

$(document).ready(function () {
    setTimeout(go, 100);
});