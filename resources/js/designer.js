/**
 * @author Averos
 */

	/*
	 *	Save settings for each layout to hash-vars for easier-to-read code
	 */

	// options for layout that wraps the tab buttons & panels
	var pageLayoutSettings = {
		name:						"pageLayout"
	,	north__paneSelector:		"#tabButtons"
	,	center__paneSelector:		"#tabPanels"
	,	south__paneSelector:		"#pageFooter"
	,	spacing_open:				0
	//	center panel contains a Tabs widget, with a layout inside 1 or more tab-panels
	,	center__onresize:			$.layout.callbacks.resizeTabLayout
	};

	// options for a 2-level layout _inside_ tab-panel #1
	var tabLayoutSettings = {
		name:						"tabLayout"
	,	initPanes:					false // delay layout init until tab.show calls tabLayout.resizeAll()
	,	resizeWithWindow:			false // needed because 'nested' inside the tabLayout div
	,	center__paneSelector:		".middle-center"
	,	west__paneSelector:			".middle-west"
//	,	east__paneSelector:			'none' //".middle-east"
	,	north__paneSelector:  		".middle-north"
//  ,	south__paneSelector:  		'none' //".middle-south"
	,	contentSelector:			".ui-widget-content"
	,	spacing_open:				4
	,	spacing_closed:				4
	,	north__minSize:				20
	,	north__spacing_open:		0
	,   north__spacing_close:		0
	,	north__togglerLength_open:	0
	,	north__togglerLength_close:	-1
	,	north__resizable:			false
	,	north__slidable:			false
	,	north__fxName:				'none'
	,	west__size:					200
	//,	west__initClosed:			true
	,	south__minSize:				5
	,	south__size:				'auto'
	,	south__togglerLength_open:	0
	,	south__togglerLength_close:	-1
	,	south__resizable:			false
	,	south__slidable:			false
	,	south__spacing_open:		1
	//	options for 2nd-level layout nested inside center-pane of tab-layout
    ,	center__childOptions: {
			name:						"innerLayout"
		,	center__paneSelector:		".inner-center"
//		,	west__paneSelector:			'none' //".inner-west"
//		,	east__paneSelector:			'none' //".inner-east"
//		,	north__paneSelector:		'none' //".inner-north"
		,	contentSelector:			".ui-widget-content"
//		,	west__initClosed:			true
//		,	east__initClosed:			true
		,	spacing_open:				4
		,	spacing_closed:				4
//		,	west__size:					361
//		,	east__size:					250
//		,	east__fxSpeed:				'slow'
//		,	north__minSize:				15
//		,	north__spacing_open:		0
//		,	north__togglerLength_open:	50
//		,	north__togglerLength_close:	-1
		}
		
	};
    /* Tree example data*/
    var data = [
    {
        label: 'Weather',
        children: [
        ]
    },
    {
        label: 'Species',
        children: [
            { label: 'child3' }
        ]
    },
     {   label: 'Flow',
        children: [
           
        ]
    }
   ];
   
   
	function addCosmeticStyles () {
		// add cosmetic Theme styles dynamically so HTML mark-up is easier to read
		// except the ui-widget-content classes, which are hard-coded because used as Layout selectors
		$('#GuildWorkbench').children().not('#innerLayout')
			.addClass('ui-widget')
				.find('>:eq(0)').addClass('ui-widget-header').end()
				//.find('>:eq(1)').addClass('ui-widget-content').end() - hard-coded
				.find('>:eq(2)').addClass('footer ui-widget-header')
		;
		$('#innerLayout').children()
			.addClass('ui-widget')
				.find('>:eq(0)').addClass('ui-widget-header').end()
				//.find('>:eq(1)').addClass('ui-widget-content').end() - hard-coded
		;
	//	$('#pageFooter').addClass('ui-widget-header')
	};


	/*
	 *	init page onLoad
	 */
	$(document).ready(function () {

		// create the tabs before the page layout because tabs will change the height of the north-pane
		$("#tabs").tabs({
			// using callback addon
			show: $.layout.callbacks.resizeTabLayout

			/* OR with a custom callback
			show: function (evt, ui) {
				$.layout.callbacks.resizeTabLayout( evt, ui );
				// other code...
			}
			*/
		});

		// add UI classes for cosmetics -- before creating layouts because may change element heights
	//	addCosmeticStyles();
        
		// create the outer/page layout
		$('body').layout( pageLayoutSettings );

		// init #GuildWorkbench tabLayout - will only partially init if tab is 'hidden'
		 $('#GuildWorkbench').layout( tabLayoutSettings );
		
		
	//	tabLayoutSettings.center__childOptions.name="LWinnerLayout";
		
        $('#LayoutWorkbench').layout( tabLayoutSettings );
        
        var $GuildToolbar = $('#GuildToolbar');
        $GuildToolbar.children().button();
        
       //This function will check for permaworkspacedb. If not found, it will create it with workspace_species and workspace_flow object stores
       init_permaworkspacedb();
       
       var dlgheight = screen.availHeight * 0.85;
       var dlgwidth = screen.availWidth * 0.65;

       // Search Dialog
       $('#SearchDialog').dialog({autoOpen: false,
                                dialogClass: 'SearchDialog',
                                height: dlgheight,
                                width: dlgwidth,
                                minHeight: dlgheight/2,
                                minWidth: dlgwidth/2,
                                modal: true,
                                buttons:[{
                                           text:'Search',class:'DialogBtn',click:function(){
                                            searchspecies();
                                           }
                                          },
                                         {
                                           text:'Add',class:'DialogBtn',click:function(){}
                                          },
                                         {
                                           text:'Cancel',class:'DialogBtn',click:function(){
                                                                                            $( this ).dialog( "close" );
                                                                                          }
                                          }
                                        ],
                                 open: function(){
                                    $(this).find('input:text').val('');
                                    $('.MatchedResult').remove();
                                 }
                                 });

       // New Project Dialog
       $('#NewProjectDialog').dialog({
           autoOpen: false,
           modal: true,
           width: 400,
           buttons: [
               { text: 'Create', class: 'DialogBtn', click: function() {
                   var name = $.trim($('#projectnameinput').val());
                   if (!name) { alert('Please enter a project name.'); return; }
                   var dlg = this;
                   ProjectManager.createProject(name, function(err, project) {
                       if (err) { alert('Error creating project: ' + err.message); return; }
                       updateProjectStatus();
                       $(dlg).dialog('close');
                   });
               }},
               { text: 'Cancel', class: 'DialogBtn', click: function() {
                   $(this).dialog('close');
               }}
           ],
           open: function() {
               $('#projectnameinput').val('');
           }
       });

       // Open Project Dialog
       $('#OpenProjectDialog').dialog({
           autoOpen: false,
           modal: true,
           width: 500,
           height: 400,
           buttons: [
               { text: 'Close', class: 'DialogBtn', click: function() {
                   $(this).dialog('close');
               }}
           ],
           open: function() {
               loadProjectList();
           }
       });

       // Delete Project Dialog
       $('#DeleteProjectDialog').dialog({
           autoOpen: false,
           modal: true,
           width: 350,
           buttons: [
               { text: 'Delete', class: 'DialogBtn', click: function() {
                   var dlg = this;
                   var projectId = $(this).data('projectId');
                   ProjectManager.deleteProject(projectId, function(err) {
                       if (err) { alert('Error deleting project: ' + err.message); return; }
                       updateProjectStatus();
                       $(dlg).dialog('close');
                   });
               }},
               { text: 'Cancel', class: 'DialogBtn', click: function() {
                   $(this).dialog('close');
               }}
           ]
       });

       // Import project file handler
       $('#importprojectfile').on('change', function(e) {
           var file = e.target.files[0];
           if (!file) return;
           ProjectManager.importProject(file, function(err, project) {
               if (err) { alert('Error importing project: ' + err.message); return; }
               updateProjectStatus();
               $('#OpenProjectDialog').dialog('close');
           });
           $(this).val('');
       });

       // Toolbar button handlers
       $('#NewGuildBtn').click(function() {
           if (ProjectManager.getCurrentProject()) {
               if (confirm('Save current project before creating a new one?')) {
                   ProjectManager.saveProject(function() {});
               }
           }
           $('#NewProjectDialog').dialog('open');
       });

       $('#OpenGuildBtn').click(function() {
           $('#OpenProjectDialog').dialog('open');
       });

       $('#CloseGuildBtn').click(function() {
           var current = ProjectManager.getCurrentProject();
           if (!current) return;
           if (confirm('Save project "' + current.name + '" before closing?')) {
               ProjectManager.saveProject(function(err) {
                   if (err) alert('Error saving: ' + err.message);
                   ProjectManager.closeProject();
                   updateProjectStatus();
               });
           } else {
               ProjectManager.closeProject();
               updateProjectStatus();
           }
       });

       $('#SaveGuildBtn').click(function() {
           var current = ProjectManager.getCurrentProject();
           if (!current) {
               alert('No project is open. Create or open a project first.');
               return;
           }
           ProjectManager.saveProject(function(err) {
               if (err) { alert('Error saving project: ' + err.message); return; }
               updateProjectStatus();
               alert('Project "' + current.name + '" saved.');
           });
       });

       $('#DeleteBtn').click(function() {
           var current = ProjectManager.getCurrentProject();
           if (!current) {
               alert('No project is open.');
               return;
           }
           $('#DeleteProjectMessage').text('Are you sure you want to delete "' + current.name + '"?');
           $('#DeleteProjectDialog').data('projectId', current.id).dialog('open');
       });

       $('#SpeciesBtn').click(function() {
           $('#SearchDialog').dialog('open');
       });

       // Init tree with default data
       $('#guildtree').tree({ data: data });

       updateProjectStatus();

	}); // end of ready function

    function updateProjectStatus() {
        var current = ProjectManager.getCurrentProject();
        if (current) {
            $('#projectStatus').text('Project: ' + current.name);
        } else {
            $('#projectStatus').text('No project open');
        }
    }

    function loadProjectList() {
        var $list = $('#ProjectList');
        $list.html('<p style="color: #666;">Loading projects...</p>');
        ProjectManager.listProjects(function(err, projects) {
            if (err) { $list.html('<p>Error loading projects.</p>'); return; }
            if (projects.length === 0) {
                $list.html('<p style="color: #666;">No saved projects. Create a new project or import one from a file.</p>');
                return;
            }
            var html = '<table class="projectlisttable" cellpadding="4" cellspacing="0" style="width:100%; border-collapse: collapse;">';
            html += '<tr style="background: #0A2A0A; color: #BCF5A9;"><th style="text-align:left; padding:6px;">Name</th><th style="text-align:left; padding:6px;">Modified</th><th style="padding:6px;">Actions</th></tr>';
            $.each(projects, function(i, p) {
                var modified = new Date(p.modified).toLocaleDateString();
                var rowBg = (i % 2 === 0) ? '#f9f9f9' : '#eeeeee';
                html += '<tr style="background:' + rowBg + '; border-bottom: 1px solid #ddd;">';
                html += '<td style="padding:6px;">' + $('<span>').text(p.name).html() + '</td>';
                html += '<td style="padding:6px;">' + modified + '</td>';
                html += '<td style="padding:6px; text-align:center;">';
                html += '<button class="openProjectBtn" data-id="' + p.id + '" style="margin-right:4px;">Open</button>';
                html += '<button class="exportProjectBtn" data-id="' + p.id + '">Export</button>';
                html += '<button class="deleteProjectListBtn" data-id="' + p.id + '" data-name="' + $('<span>').text(p.name).html() + '" style="margin-left:4px;">Delete</button>';
                html += '</td></tr>';
            });
            html += '</table>';
            $list.html(html);

            $list.find('.openProjectBtn').button().click(function() {
                var id = $(this).data('id');
                ProjectManager.openProject(id, function(err, project) {
                    if (err) { alert('Error opening project: ' + err.message); return; }
                    updateProjectStatus();
                    $('#OpenProjectDialog').dialog('close');
                });
            });

            $list.find('.exportProjectBtn').button().click(function() {
                var id = $(this).data('id');
                ProjectManager.openProject(id, function(err) {
                    if (err) { alert('Error: ' + err.message); return; }
                    ProjectManager.exportProject();
                    updateProjectStatus();
                });
            });

            $list.find('.deleteProjectListBtn').button().click(function() {
                var id = $(this).data('id');
                var name = $(this).data('name');
                if (confirm('Delete project "' + name + '"? This cannot be undone.')) {
                    ProjectManager.deleteProject(id, function(err) {
                        if (err) { alert('Error: ' + err.message); return; }
                        updateProjectStatus();
                        loadProjectList();
                    });
                }
            });
        });
    }

function init_permaworkspacedb(){
	
    window.indexedDB = window.indexedDB || window.webkitIndexedDB;
    
      if(window.indexedDB){
      
      var permanamespace = {}; //may need this if domain is required for indexedDB to work 
	  var dbname= "permaworkspacedb";
	  permanamespace.indexedDB = {};
	  permanamespace.indexedDB.permaworkspacedb = null;
      
      //for testing delete db
 //     var dbdrequest = indexedDB.deleteDatabase(dbname);
  //   dbdrequest.onsuccess =function(event){
  //    	alert('deleted database..proceeding');
      var dborequest = indexedDB.open(dbname,1);
      
      dborequest.onupgradeneeded = function (event){  	
        	permanamespace.indexedDB.permaworkspacedb = event.target.result;
        	var permaworkspacedb= permanamespace.indexedDB.permaworkspacedb;
        	try{
        	var speciesworkspaceobjstore = permaworkspacedb.createObjectStore("species_workspace",{keyPath:"snm"});
        	var flowworkspaceobjstore = permaworkspacedb.createObjectStore("flow_workspace",{keyPath:"flowid"});
        	alert('species_workspace and flow_workspace object stores created');
  //      	permaworkspacedb.close(); 
  //      	return;
        	}
        	catch(err)
        	{alert('Unable to create workspace object stores:'+err.message); 
        	  window.location='index.html';
        	}
       };
        
        dborequest.onsuccess = function(event) {
        	permanamespace.indexedDB.permaworkspacedb = event.target.result;
        	var permaworkspacedb= permanamespace.indexedDB.permaworkspacedb;
   //     	alert('successful now i can try and close db');
        	  permaworkspacedb.close();
        };
        
        dborequest.onerror = function(event) {
           alert("Unable to open permaworkspacedb: "+dborequest.error.name);
           window.location='index.html';
          };
        
 // for debugging with delete db request      }
     }
	 else{
			 alert('indexedDb is not supported by this browser');
		     window.location='index.html';
	 }	
	
}// end init_permaworkspacedb






function searchspecies(){
	var index=1;
	var result = "<div class='MatchedResult' id='result"+index+"'>"+ $('#speciesnameinput').val()+"</div>";
	
//	alert(result);
	$('.MatchedResult').remove();
	$(result).appendTo('#SearchResult');
}




function createshapeinstance(shapeid){
	  
        var shape = createshapehtml(shapeid);
        
        $(shape).appendTo('#guilddrawpane');

        var newwidth;
        var newheight;
        
       jsPlumb.draggable($("#"+shapeid),{ stack: ".speciesshape",
        	                              cancel: "#"+shapeid+"infobtn"+","+
                                          		  "#"+shapeid+"restorebtn"+","+
                                                  "#"+shapeid+"output"+","+
                                                  "#"+shapeid+"input"});
     
        $("#"+shapeid).resizable({
        	resize: function(event, ui)
                {
                	jsPlumb.repaint(ui.helper);
                	newwidth = ((ui.size.width-1)/2);
                	newheight = (ui.size.height-55);
                	
    	            $("#"+shapeid+"output").css({"height":newheight+"px","width":newwidth+"px"});
    	            $("#"+shapeid+"input").css({"height":newheight+"px","width":newwidth+"px"});
                }
        	       	
        });
	
	
}




var imagepath = "resources/css/images/";

function createshapehtml(shapeid){

 var inputelementhtml = "<div class='inputelement'><p>water</p></div>"+
                        "<div class='inputelement'><p>feed</p></div>"+
                        "<div class='inputelement'><p>temperature</p></div>"+
                        "<div class='inputelement'><p>air</p></div>";  
  
 var ouputelementhtml = "<div class='outputelement'><p>egg</p></div>"+
                        "<div class='outputelement'><p>feather</p></div>"+
                        "<div class='outputelement'><p>meat</p></div>"+
                        "<div class='outputelement'><p>nitrates</p></div>";
                        
  var shapehtml = "<div id='"+shapeid+"' class='speciesshape' class='ui-state-active' >"+
                                         "<div class='shapeheader'>"+
                                         shapeid+
                                         "<div  id='"+shapeid+"infobtn' class='shapecontrolbtn' type='submit'><image src="+imagepath+"info.png></div>"+
                                         "<div  id='"+shapeid+"restorebtn' class='shapecontrolbtn' type='submit'><image src="+imagepath+"restore.png></div>"+
                                         "</div>"+
                                         
                                         "<table class='shapecontenttable' border='1' cellpadding='0'>"+
                                         
                                         "<tr class='gridheader'>"+"<th width='50%'>Input</th>"+"<th width='50%'>Output</th>"+"</tr>"+
                                         
                                         "<tr class='gridcontent'>"+                                         
                                         "<td width='50%'>" +"<div id='"+shapeid+"input' class='shapeinnerscroll' >"+inputelementhtml+"</div>"+"</td>"+
                                         "<td width='50%'>" +"<div id='"+shapeid+"output' class='shapeinnerscroll' >"+ouputelementhtml+"</div>"+"</td>"+
                                         "</tr>"+
                                         
                                         "</table>"+  
                "</div>" ;
return shapehtml	
}
