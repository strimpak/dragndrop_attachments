/* dragndrop_attachments script */
if (window.rcmail) {
	rcmail.addEventListener('init', function(evt) {
			$(document).ready(function() {
				var drag_attach = document.getElementById('compose-attachments');
				drag_attach.ondragenter = drag_attach.ondragover = function (e) {
				e.preventDefault();
				$('#compose-attachments').css("background-color", "#FFFFA6");
				e.dataTransfer.dropEffect = 'copy';
				return false;
				}

				drag_attach.ondragleave = function (e) {
				e.preventDefault();
				$('#compose-attachments').css("background-color", "#fff");
				e.dataTransfer.dropEffect = 'copy';
				return false;
				}

				drag_attach.ondrop = upload;

				function createInstance()
				{
				if (window.XMLHttpRequest)
				{
					req = new XMLHttpRequest();
				}
				else
					rcmail.display_message(rcmail.get_label('fileuploaderror'), 'error');
				return(req);
				};
				function startBuilder(bdary)
				{
					var dashdash = '--',
						crlf = '\r\n',
						builder = '';
					builder += dashdash;
					builder += bdary;
					builder += crlf;
					builder += 'Content-Disposition: form-data; name="_token"';
					builder += crlf;
					builder += crlf;
					builder += document.getElementsByName("_token")[0].value;
					builder += crlf;
					return builder;
				}
				function getBuilder(fname, fdata, bdary) {
					var dashdash = '--',
						crlf = '\r\n',
						builder = '';

					/* Write boundary. */
					builder += dashdash;
					builder += bdary;
					builder += crlf;
					builder += 'Content-Disposition: form-data; name="_attachments[]"';
					builder += '; filename="' +  unescape( encodeURIComponent( fname ) ) + '"';
					builder += crlf;
					
					builder += 'Content-Type: application/octet-stream';
					builder += crlf;
					builder += crlf; 
					
					builder += fdata;
					builder += crlf;
			        
					
					return builder;
				}
				function stopBuilder(bdary)
				{
					var dashdash = '--',
						crlf = '\r\n',
						builder = '';

					builder += dashdash;
					builder += bdary;
					builder += dashdash;
					builder += crlf;
					return builder;
				}
			function upload(event) {
				event.stopPropagation();
				event.preventDefault();
				$('#compose-attachments').css("background-color", "#fff");
				data = event.dataTransfer;
				if(data.files.length > 4)
				{
					alert(rcmail.gettext('too_many_files_to_upload','dragndrop_attachments'));
					return false;
				}
				var total_size = 0;
				for(var l = 0; l < data.files.length; l++)
					total_size = total_size + data.files[l].size;
				if(total_size > 10000000)
				{
					alert(rcmail.gettext('files_to_upload_bigger_than_allowed','dragndrop_attachments'));
					return false;
				}
				var boundary = '----WebKitFormBoundary' + (new Date).getTime();
				var builder = '';
				var readyToGo = data.files.length;
				
				var reader;
				//console.log(builder);
			    var ts = new Date().getTime(),
							    frame_name = 'rcmupload'+ts;
                                                        var id = ts;
                                                        var files=data.files;
                                                     
							var action = rcmail.url("upload", { _id:rcmail.env.compose_id||'', _uploadid:ts });
							var content = '<span>' + rcmail.get_label('uploading' + (files.length > 1 ? 'many' : '')) + '</span>',
						        ts = frame_name.replace(/^rcmupload/, '');

						      if (rcmail.env.loadingicon)
						        content = '<img src="'+rcmail.env.loadingicon+'" alt="" class="uploading" />'+content;
						      content = '<a title="'+rcmail.get_label('cancel')+'" onclick="return rcmail.cancel_attachment_upload(\''+ts+'\', \''+frame_name+'\');" href="#cancelupload" class="cancelupload">'
						        + (rcmail.env.cancelicon ? '<img src="'+rcmail.env.cancelicon+'" alt="" />' : rcmail.get_label('cancel')) + '</a>' + content;
						      
						      rcmail.add2attachment_list(ts, { name:'', html:content, classname:'uploading', complete:false });

				for (var i = 0; i < data.files.length; i++) {
						reader = new FileReader();
						reader.data = data;
						reader.file = data.files[i];
						var file = data.files[i];
						reader.name = data.files[i].name;
						reader.readAsBinaryString(file);
						reader.onload = read_done;
							 
				}
				function read_done(event)
				{
					
					builder = builder + getBuilder(event.target.name, event.target.result, boundary );
					
					readyToGo --;

					if(readyToGo == 0)
					{
						sendAllFiles(builder,boundary);
						
					}
				}
				function sendAllFiles(datastring,mybdary)
				{
					var boundary = mybdary;
					var builder = startBuilder(boundary);
					builder = builder + datastring;
					builder = builder + stopBuilder(boundary);
							var xhr = createInstance();
							xhr.open("POST", action, true);
							xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + boundary);
							xhr.sendAsBinary = function(datastr) {
								function byteValue(x) {
							        return x.charCodeAt(0) & 0xff;
							    }
							    var ords = Array.prototype.map.call(datastr, byteValue);
							    var ui8a = new Uint8Array(ords);
							    this.send(ui8a.buffer);
							}
							xhr.sendAsBinary(builder);

							xhr.onreadystatechange = function() {
        							if(xhr.readyState == 4){
									var mycontent = '';
				          			mycontent = xhr.responseText;
				      				if (!mycontent.match(/add2attachment/) ) {
									if (!mycontent.match(/display_message/))
										rcmail.display_message(rcmail.get_label('fileuploaderror'), 'error');
									}
									var from = mycontent.search('rcmfile');
									var to = from + 31;
									var myframe_name = mycontent.substring(from, to);
								    var frame = document.createElement('iframe');
								    frame.name = myframe_name;
								    frame.style.border = 'none';
								    frame.style.width = 0;
								    frame.style.height = 0;
								    frame.style.visibility = 'hidden';
								    document.body.appendChild(frame);
				    				var doc = frame.document;
									if(frame.contentDocument)
										doc = frame.contentDocument; // For NS6
									else if(frame.contentWindow)
										doc = frame.contentWindow.document; // For IE5.5 and IE6
									// Put the content in the iframe
									doc.open();
									doc.writeln(mycontent);
									doc.close();
									rcmail.display_message(rcmail.gettext('all_files_successfully_uploaded', 'dragndrop_attachments'), 'confirmation');
								}
				         }
				}
				/* Prevent FireFox opening the dragged file. */
				event.stopPropagation();

			}

			});
	})

}
