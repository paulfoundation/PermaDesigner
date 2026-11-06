var ProjectManager = (function () {

    var DB_NAME = "permaprojectsdb";
    var DB_VERSION = 1;
    var STORE_NAME = "projects";
    var currentProject = null;

    function openDB(callback) {
        var request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = function (e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                var store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                store.createIndex("name", "name", { unique: false });
                store.createIndex("modified", "modified", { unique: false });
            }
        };
        request.onsuccess = function (e) {
            callback(null, e.target.result);
        };
        request.onerror = function (e) {
            callback(e.target.error, null);
        };
    }

    function generateId() {
        return "proj_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    }

    function captureCurrentState() {
        var species = [];
        $("#guilddrawpane .speciesshape").each(function () {
            var $el = $(this);
            species.push({
                id: $el.attr("id"),
                label: $el.find(".shapeheader").contents().filter(function () {
                    return this.nodeType === 3;
                }).text().trim(),
                left: parseInt($el.css("left"), 10) || 0,
                top: parseInt($el.css("top"), 10) || 0,
                width: $el.width(),
                height: $el.height(),
                inputs: $el.find(".inputelement p").map(function () { return $(this).text(); }).get(),
                outputs: $el.find(".outputelement p").map(function () { return $(this).text(); }).get()
            });
        });

        var connections = [];
        $.each(jsPlumb.getConnections(), function (_, conn) {
            connections.push({
                source: conn.sourceId,
                target: conn.targetId,
                label: conn.getOverlay("label") ? conn.getOverlay("label").getLabel() : ""
            });
        });

        var treeData = $("#guildtree").tree("getTree") ? $("#guildtree").tree("toJSON") : "[]";

        return {
            species: species,
            connections: connections,
            treeData: treeData
        };
    }

    function restoreState(state) {
        jsPlumb.detachEveryConnection();
        jsPlumb.deleteEveryEndpoint();
        $("#guilddrawpane").empty();

        if (state.species && state.species.length > 0) {
            $.each(state.species, function (_, sp) {
                var inputHtml = "";
                $.each(sp.inputs, function (_, inp) {
                    inputHtml += "<div class='inputelement'><p>" + escapeHtml(inp) + "</p></div>";
                });
                var outputHtml = "";
                $.each(sp.outputs, function (_, out) {
                    outputHtml += "<div class='outputelement'><p>" + escapeHtml(out) + "</p></div>";
                });

                var imagepath = "resources/css/images/";
                var shapehtml = "<div id='" + sp.id + "' class='speciesshape' style='left:" + sp.left + "px;top:" + sp.top + "px;width:" + sp.width + "px;height:" + sp.height + "px;'>" +
                    "<div class='shapeheader'>" + escapeHtml(sp.label) +
                    "<div id='" + sp.id + "infobtn' class='shapecontrolbtn' type='submit'><image src=" + imagepath + "info.png></div>" +
                    "<div id='" + sp.id + "restorebtn' class='shapecontrolbtn' type='submit'><image src=" + imagepath + "restore.png></div>" +
                    "</div>" +
                    "<table class='shapecontenttable' border='1' cellpadding='0'>" +
                    "<tr class='gridheader'><th width='50%'>Input</th><th width='50%'>Output</th></tr>" +
                    "<tr class='gridcontent'>" +
                    "<td width='50%'><div id='" + sp.id + "input' class='shapeinnerscroll'>" + inputHtml + "</div></td>" +
                    "<td width='50%'><div id='" + sp.id + "output' class='shapeinnerscroll'>" + outputHtml + "</div></td>" +
                    "</tr></table></div>";

                $(shapehtml).appendTo("#guilddrawpane");

                jsPlumb.draggable($("#" + sp.id), {
                    stack: ".speciesshape",
                    cancel: "#" + sp.id + "infobtn,#" + sp.id + "restorebtn,#" + sp.id + "output,#" + sp.id + "input"
                });

                $("#" + sp.id).resizable({
                    resize: function (event, ui) {
                        jsPlumb.repaint(ui.helper);
                        var newwidth = ((ui.size.width - 1) / 2);
                        var newheight = (ui.size.height - 55);
                        $("#" + sp.id + "output").css({ "height": newheight + "px", "width": newwidth + "px" });
                        $("#" + sp.id + "input").css({ "height": newheight + "px", "width": newwidth + "px" });
                    }
                });
            });
        }

        if (state.connections && state.connections.length > 0) {
            $.each(state.connections, function (_, conn) {
                if (document.getElementById(conn.source) && document.getElementById(conn.target)) {
                    var overlays = [];
                    if (conn.label) {
                        overlays.push(["Label", { cssClass: "connectorlabel", label: conn.label, id: "label" }]);
                    }
                    jsPlumb.connect({
                        source: conn.source,
                        target: conn.target,
                        paintStyle: { strokeStyle: "blue", lineWidth: 6 },
                        endpointStyle: { fillStyle: "blue" },
                        anchors: ["RightMiddle", "LeftMiddle"],
                        overlays: overlays
                    });
                }
            });
        }

        if (state.treeData) {
            try {
                var treeData = typeof state.treeData === "string" ? $.parseJSON(state.treeData) : state.treeData;
                $("#guildtree").tree("loadData", treeData);
            } catch (e) {
                // fallback to default tree
            }
        }
    }

    function escapeHtml(str) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function clearWorkbench() {
        jsPlumb.detachEveryConnection();
        jsPlumb.deleteEveryEndpoint();
        $("#guilddrawpane").empty();
        var defaultTree = [
            { label: "Weather", children: [] },
            { label: "Species", children: [] },
            { label: "Flow", children: [] }
        ];
        $("#guildtree").tree("loadData", defaultTree);
    }

    return {
        getCurrentProject: function () {
            return currentProject;
        },

        createProject: function (name, callback) {
            var project = {
                id: generateId(),
                name: name,
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                species: [],
                connections: [],
                treeData: "[]"
            };

            openDB(function (err, db) {
                if (err) { callback(err); return; }
                var tx = db.transaction(STORE_NAME, "readwrite");
                var store = tx.objectStore(STORE_NAME);
                store.put(project);
                tx.oncomplete = function () {
                    currentProject = project;
                    clearWorkbench();
                    db.close();
                    callback(null, project);
                };
                tx.onerror = function (e) {
                    db.close();
                    callback(e.target.error);
                };
            });
        },

        saveProject: function (callback) {
            if (!currentProject) {
                callback(new Error("No project is currently open"));
                return;
            }
            var state = captureCurrentState();
            currentProject.species = state.species;
            currentProject.connections = state.connections;
            currentProject.treeData = state.treeData;
            currentProject.modified = new Date().toISOString();

            openDB(function (err, db) {
                if (err) { callback(err); return; }
                var tx = db.transaction(STORE_NAME, "readwrite");
                var store = tx.objectStore(STORE_NAME);
                store.put(currentProject);
                tx.oncomplete = function () {
                    db.close();
                    callback(null, currentProject);
                };
                tx.onerror = function (e) {
                    db.close();
                    callback(e.target.error);
                };
            });
        },

        openProject: function (projectId, callback) {
            openDB(function (err, db) {
                if (err) { callback(err); return; }
                var tx = db.transaction(STORE_NAME, "readonly");
                var store = tx.objectStore(STORE_NAME);
                var request = store.get(projectId);
                request.onsuccess = function (e) {
                    var project = e.target.result;
                    db.close();
                    if (!project) {
                        callback(new Error("Project not found"));
                        return;
                    }
                    currentProject = project;
                    restoreState({
                        species: project.species || [],
                        connections: project.connections || [],
                        treeData: project.treeData || "[]"
                    });
                    callback(null, project);
                };
                request.onerror = function (e) {
                    db.close();
                    callback(e.target.error);
                };
            });
        },

        closeProject: function () {
            if (currentProject) {
                currentProject = null;
                clearWorkbench();
            }
        },

        deleteProject: function (projectId, callback) {
            openDB(function (err, db) {
                if (err) { callback(err); return; }
                var tx = db.transaction(STORE_NAME, "readwrite");
                var store = tx.objectStore(STORE_NAME);
                store.delete(projectId);
                tx.oncomplete = function () {
                    if (currentProject && currentProject.id === projectId) {
                        currentProject = null;
                        clearWorkbench();
                    }
                    db.close();
                    callback(null);
                };
                tx.onerror = function (e) {
                    db.close();
                    callback(e.target.error);
                };
            });
        },

        listProjects: function (callback) {
            openDB(function (err, db) {
                if (err) { callback(err); return; }
                var tx = db.transaction(STORE_NAME, "readonly");
                var store = tx.objectStore(STORE_NAME);
                var projects = [];
                var cursor = store.index("modified").openCursor(null, "prev");
                cursor.onsuccess = function (e) {
                    var result = e.target.result;
                    if (result) {
                        projects.push(result.value);
                        result.continue();
                    } else {
                        db.close();
                        callback(null, projects);
                    }
                };
                cursor.onerror = function (e) {
                    db.close();
                    callback(e.target.error);
                };
            });
        },

        exportProject: function () {
            if (!currentProject) return null;
            var state = captureCurrentState();
            var exportData = {
                name: currentProject.name,
                created: currentProject.created,
                modified: new Date().toISOString(),
                species: state.species,
                connections: state.connections,
                treeData: state.treeData
            };
            var json = JSON.stringify(exportData, null, 2);
            var blob = new Blob([json], { type: "application/json" });
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = currentProject.name.replace(/[^a-z0-9]/gi, "_") + ".json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return exportData;
        },

        importProject: function (file, callback) {
            var reader = new FileReader();
            reader.onload = function (e) {
                try {
                    var data = $.parseJSON(e.target.result);
                    var project = {
                        id: generateId(),
                        name: data.name || file.name.replace(".json", ""),
                        created: data.created || new Date().toISOString(),
                        modified: new Date().toISOString(),
                        species: data.species || [],
                        connections: data.connections || [],
                        treeData: data.treeData || "[]"
                    };

                    openDB(function (err, db) {
                        if (err) { callback(err); return; }
                        var tx = db.transaction(STORE_NAME, "readwrite");
                        var store = tx.objectStore(STORE_NAME);
                        store.put(project);
                        tx.oncomplete = function () {
                            currentProject = project;
                            restoreState({
                                species: project.species,
                                connections: project.connections,
                                treeData: project.treeData
                            });
                            db.close();
                            callback(null, project);
                        };
                        tx.onerror = function (e) {
                            db.close();
                            callback(e.target.error);
                        };
                    });
                } catch (ex) {
                    callback(ex);
                }
            };
            reader.readAsText(file);
        }
    };
})();
