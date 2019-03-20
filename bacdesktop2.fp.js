/**
 * CRI-17851.
 * Se crea el componente. Esta clase permite interactuar con el BAC Desktop que se encuentra
 * instalado en la maquina local del usuario.
 * @author darcia
 * @since 2016-05-08
 * @version 1.0
 *
 * CRI-17851.
 * Se realiza una actualizacion del componente para trabajar con backend de portal.
 * @author darcia
 * @since 2017-11-02
 * @version 1.1
 *
 * @version darcia (1.0), darcia (1.1)
* */
var DesktopClient = Stapes.subclass({

    constructor : function(options){
        //IDs de los elementos del DOM que se agregaran dinamicamente, para poder
		//hacer trigger del BAC Desktop
		this.triggerLinkId = "BACDesktop"+new Date().getTime();
        this.modalId = this.triggerLinkId+'modal';
		this.modalWarningId = this.triggerLinkId+'warning';

		//Almacena el endpoint que atiende el desktop
		this.endpoint = "";
		//Bandera que especifica si se ejecuta un entorno bootstrap
		this.bootstrapSupport = true;
		//Bandera que especifica si se tira a consola
		this.debug = false;
		
		if(options){
			if(typeof options.bootstrapSupport != 'undefined') this.bootstrapSupport = options.bootstrapSupport;
			if(typeof options.endpoint != 'undefined') this.endpoint = options.endpoint;
			if(typeof options.debug != 'undefined') this.debug = options.debug;
		}

		this.log("BACDesktop [endpoint] : "+ this.endpoint);
		this.log("BACDesktop [bootstrapSupport] : "+ this.bootstrapSupport);		
		
		//Agrega los elementos creados temporalmente
	    $("body").append($("<a id='"+this.triggerLinkId+"' href='#'></a>"));
		if(this.bootstrapSupport){
			$("body").append(this.createModal());
			$("body").append(this.createWarningModal());		
		}else{
			$("body").append(this.createjQueryModal());		
			$(".overlay").css({
				"position":"fixed",
				"top":"0",
				"bottom":"0",
				"left":"0",
				"right":"0",
				"background-color":"black",
				"opacity":"0.5",
				"z-index":"1001",
				"text-align": "center"
			});
			$(".overlay-message").css({
				"position": "fixed",
				"display": "inline-block",				
				"top":"30px",
				"left":"30px",
				"width":"350px",
				"height":"250px",
				"background-color":"#fff",
				"opacity":"1",
				"z-index":"1002"				,
				"border-radius": "10px",
				"padding-top": "10px"
			});			
			$(".overlay, .overlay-message").hide();			
		}		
    },

    /**
     * Metodo generico para despachar un callback
     * */
    dispatchCallback: function(callback, data){
        if(callback){
            callback.call(this, data);
        }
    },
	
	/**
	* Valida si el endpoint esta definido	
	*/
	validateEndpoint: function(){
		var result = true;
		//Valida que se haya definido el endpoint
		if(!this.endpoint){
			alert("Por favor especificar la direccion del backend de BAC Desktop.");
			result = false;
		}
		return result;
	},
	
	/**
	* Log	
	*/
	log: function(text){
		if(this.debug){
			console.log("DEBUG :: " + text);
		}
	},
	
    /**
     * Limpia views
     * */
     clear: function(){
		if(this.bootstrapSupport){
			$('#'+this.modalWarningId).modal('hide');
			$('#'+this.modalId).modal('hide');
		}
        $('body').removeClass('modal-open');
		$(".overlay, .overlay-message").hide();
        $('.modal-backdrop').remove();
     },

	/**
	* Verifica el status del producto
	**/
     status: function(callback){
        var self = this;
					 		
		//Valida que se haya definido el endpoint
		if(!this.validateEndpoint()) return;
							
        //Verifica si el llamado es modal        
        if(this.bootstrapSupport){
			//Muestra el modal
            $("#"+this.modalId).modal({
                backdrop: 'static',
                keyboard: false
            });
        }

		//Al link creado temporalmente agregar el URI schema del desktop
		$("#"+this.triggerLinkId).attr("href", "bacdesktop2:status");
		//Vanilla JS dado que jQuery no soporta el click del link
		document.getElementById(this.triggerLinkId).click();        
		
		setTimeout(function(){
			//Se detecto un error
			self.clear();
			self.dispatchCallback(callback, "Estado de BAC Desktop solicitado. Verificar el resultado en la herramienta.");			
		},3000);		
		
	 },	 	 
	 
    /**
     * Realiza un request para obtener una sesion con el BAC Desktop
     * */
     sendRequest: function(message, callback){
        var self = this;
		
		//Valida que se haya definido el endpoint
		if(!this.validateEndpoint()) return;
		
		//Valida el request
		if(!message){
             this.dispatchCallback(callback);
		}
		 
		if(!message.module){
             this.dispatchCallback(callback);
		}

        if(!message.operationCode){
            this.dispatchCallback(callback);
        }

        if(!message.userName){
            this.dispatchCallback(callback);
        }

        if(!message.tramitId){
            message.tramitId = new Date().getTime();
        }

        //Direccion del endpoint pasado al desktop
        message.endpoint = this.endpoint;
        
        //Verifica si no se debe esperar respuesta
        var avoidWaitingforAnswer = false;
        if(typeof message.avoidWaitingforAnswer != 'undefined'){
        	avoidWaitingforAnswer = message.avoidWaitingforAnswer;
        }
		
		//Verifica si se debe mostrar el dialogo de progreso
		var showModal = true;
		if(typeof message.modal != 'undefined') {
			showModal = message.modal;
		}

        //Verifica si el llamado es modal        
        if(this.bootstrapSupport && showModal){
			var modalType = message.modalType;
			if(modalType){
				//Si solo hay que mostrar el reloj
				if(modalType === 'spinner'){
					$("#"+this.modalId+" .desktopInfoText").hide();
					//Muestra el modal
					$("#"+this.modalId).modal({
						backdrop: 'static',
						keyboard: false
					});					
				//Si se debe mostrar le texto guia	
				}else if(modalType === 'info'){
					$("#"+this.modalId+" .desktopInfoText").show();
					//Muestra el modal
					$("#"+this.modalId).modal({
						backdrop: 'static',
						keyboard: false
					});
				}
			}else{
				//Muestra el modal
				$("#"+this.modalId+" .desktopInfoText").show();
				$("#"+this.modalId).modal({
					backdrop: 'static',
					keyboard: false
				});			
			}
        }else{
			if(showModal){
				 $(".overlay, .overlay-message").show();
			}
		}

        //Pasa el objeto a string, para adjuntarlo al URI del schema
        var requestString = JSON.stringify(message);

		//Realiza las configuraciones necesarias para mandar el mensaje en formato valido
		//Hace un encode de los datos para poder utilizarla de URI
		var requestStringEncoded = requestString.replace(/"/g, '\\"');
		requestStringEncoded = "\"" + requestStringEncoded + "\"";			
		requestStringEncoded = window.btoa(requestStringEncoded);			
		
		//Registra el request en el backend
        var self = this;
        var url = '/bacdesktop/saveRequest.m';
		var data = {
			requestStr: requestString,
			requestStrBase64: requestStringEncoded
		}
		//Guarda el request
        //this.saveRequest(self, url, data, function(result){
			//Es una respuesta satisfactoria
			//if(result != "error"){
				//Al link creado temporalmente agregar el URI schema del desktop
				$("#"+self.triggerLinkId).attr("href", "bacdesktop2:"+requestStringEncoded);
				//Vanilla JS dado que jQuery no soporta el click del link
				document.getElementById(self.triggerLinkId).click();        
				//si no debe esperar por respuesta cierra el modal
				if(avoidWaitingforAnswer){
					//Ejecuta el consultado de la respuesta
					setTimeout(function(){
					   self.clear();
					}, 3000);
				}else{
					//Ejecuta el consultado de la respuesta
					setTimeout(function(){
					   self.getResponse(message, function(response){
							//Oculta el mensaje de progreso
							if(self.bootstrapSupport){
							   $("#"+this.modalId).modal('hide');
							}					   
							//No se obtuvo respuesta totalmente deld esktop
							if(!response || response.resultCode === "error"){
								//Mensaje de warning
								if(self.bootstrapSupport){
								   $("#"+this.modalWarningId).modal();
								}			   							
							}					   
						   self.dispatchCallback(callback, response);
					   });
					}, 2000);
				}
			//}else{
				//Se detecto un error
			//	self.clear();
			//	self.dispatchCallback(callback);
			//}
		
        //});
		
	 },

    /**
     * Consulta por la respuesta
     * */
     getResponse: function(message, callback){
        //Metodo que se encarga de obtener la respuesta del desktop
        this.waitForAnswer(message, 0, callback);
     },

    /**
     * Metodo que se encarga de obtener la respuesta del desktop
     * */
    waitForAnswer: function(message, iterationCounter, callback){
        var self = this;
        var module = message.module;
        var tramitId = message.tramitId;
		
		//Estructura de respuesta al cliente
		var response = {};
		response.resultCode = "fail";
		
		//Ya ha agotado todos los reintentos		
        if(iterationCounter >= 250){
			self.dispatchCallback(callback, response);
            return false;
        }
		
		//Registra el request en el backend
        var self = this;
        var url = '/bacdesktop/getResponse.m';
        var params = "tramitId="+message.tramitId;
		//Guarda el request
        this.retrieveAnswer(this, url, params, function(result){		
			try{
				//No hay respuesta, reintenta
				if(!result){
					if(iterationCounter < 60){ 
						//reintenta
						setTimeout(function(){
							iterationCounter++;
							self.log("BACDesktop ["+tramitId+"] : Retying response query...("+iterationCounter+")");
							self.waitForAnswer(message, iterationCounter, callback);
						},2000);
					}else{							
						self.dispatchCallback(callback, response);
					}						
				}else{
					//Hay respuesta, es error?
					if(result === "error"){
						self.log("BACDesktop ["+tramitId+"] : Invalid response!");
						self.clear();							
						self.dispatchCallback(callback, response);							
					}else{
						self.log("BACDesktop ["+tramitId+"] : Response found!");
						self.clear();	
						try{
							//Es un respuesta valida							
							var content = JSON.parse(result);
							response.resultCode = content.resultCode;
							response.resultContent = content;
						}catch(e){							
							console.log("BACDesktop ["+tramitId+"] : " + e);
						}
						self.dispatchCallback(callback, response);						
					}										
				}
			}catch(e){
				console.log("BACDesktop ["+tramitId+"] : " + e);
				self.clear();
				self.dispatchCallback(callback);
			}		
		});
    },    
    
    saveBatchRequest: function(batchMessage, callback){    	
    	var messageString = JSON.stringify(batchMessage);    	
    	$.ajax({
    		  url: "http://localhost:8080/desktop",
    		  type: "POST",
    		  crossDomain: true,
    		  headers: {
                  'Content-type': 'application/x-www-form-urlencoded'
              },
    		  data: {message: messageString},
    		  success: function(data) {
    			  callback.call(this, data);
    		 },
    		  error: function(error) {
    			  callback.call(this, {result: false});
    		  },
    		});    	
    },
	
	/**
     * Ejecuta una llamada ajax para consultar
     * */
    retrieveAnswer : function(owner, url, params, callback){
		var self = this;
        var controller = this.endpoint + url + "?" + params;		
        return $.ajax({
            url: controller,
            cache: false,
            global: false,
            type: "GET",
			timeout: 10000,
            async : true,
            success: function(returnedValue){			
				self.dispatchCallback(callback, returnedValue ? returnedValue.result : "error");
            },
            error: function(jqXHR, textStatus, errorThrown ){				
				console.log("BACDesktop [NETWORK] : Error! " + textStatus + "," + jqXHR.responseText);
				self.dispatchCallback(callback, "error");
            }
        });
    },	
	
	/**
     * Ejecuta una llamada ajax para guardar
     * */
    saveRequest : function(owner, url, data, callback){
		var self = this;
        if(!data) data = '';
        var controller = this.endpoint + url;
		jQuery.support.cors = true;
        return $.ajax({
            url: controller,
            data: data,
            cache: false,
			dataType: 'json',
			timeout: 10000,
			crossDomain: true,
            global: false,
            type: "POST",
            contentType: "application/x-www-form-urlencoded;charset=utf-8",
            async : true,
            success: function(returnedValue){			
				self.dispatchCallback(callback, returnedValue ? returnedValue.result : "error");
            },
            error: function(jqXHR, textStatus, errorThrown ){				
				console.log("BACDesktop [NETWORK] : Error! " + textStatus + "," + jqXHR.responseText);
				self.dispatchCallback(callback, "error");
            }
        });
    },
	
	createModal: function(){
        var loadingImage = this.endpoint + "/views/plugins/common/bacdesktop/img/desktoploader.gif";
        var arrowImage = this.endpoint + "/views/plugins/common/bacdesktop/img/arrow.png";

       var loadingModal = "";
        loadingModal += '<div class="modal fade" id="'+this.modalId+'" role="dialog">';
        loadingModal += '    <div class="modal-dialog modal-sm">';
        loadingModal += '        <div class="modal-content">';
        loadingModal += '            <div class="modal-body">';
        loadingModal += '                <p style="text-align:center;padding-bottom:10px;padding-top:10px;"><img src="'+loadingImage+'" /></p>' +
            '<div class="well desktopInfoText" style="padding:20px;">' +
                                        '<p>Se le solicitar&aacute; la informaci&oacute;n necesaria en el panel auxiliar que aparece en la parte inferior de su pantalla.</p>' +
                                        '<p>Una vez finalizado, podr&aacute; continuar con el flujo normal en la p&aacute;gina actual.</p>' +
            '<p class="pull-right"><img width="103" height="120" src="'+arrowImage+'" /></p>' +
                                    '</div>';
        loadingModal += '            </div>';
        loadingModal += '        </div>';
        loadingModal += '    </div>';
        loadingModal += ' </div>';
        loadingModal += '</div>';
        return loadingModal;
    },
	
    createWarningModal: function(){
       var loadingModal = "";
        loadingModal += '<div class="modal fade" id="'+this.modalWarningId+'" role="dialog">';
        loadingModal += '    <div class="modal-dialog modal-sm">';
        loadingModal += '        <div class="modal-content">';
        loadingModal += '            <div class="modal-body">';
        loadingModal += '                <div class="well" style="padding:20px;">' +
                                        '<p>No se obtuvo respuesta en el tiempo esperado del BAC Desktop por favor vuelva a intentarlo. Si tiene un panel de BAC Desktop abierto, por favor cerrarlo.</p>' +
                                        '<p>Puede continuar con el flujo normal en la p&aacute;gina actual.</p>' +
                                    '</div>';
        loadingModal += '            </div>';
        loadingModal += '        </div>';
        loadingModal += '    </div>';
        loadingModal += ' </div>';
        loadingModal += '</div>';
        return loadingModal;
    },
	
	createjQueryModal: function(){
		var loadingImage = this.endpoint + "/views/plugins/common/bacdesktop/img/desktoploader.gif";		
		var arrowImage = this.endpoint + "/views/plugins/common/bacdesktop/img/arrow.png";
		var loadingModal = '<div class="overlay"></div><div class="overlay-message"><p style="text-align:center;padding-bottom:10px;padding-top:10px;"><img src="'+loadingImage+'" /></p>' +
            '<div class="desktopInfoText" style="padding:20px;">' +
            '<p>Se le solicitar&aacute; la informaci&oacute;n necesaria en el panel auxiliar que aparece en la parte inferior de su pantalla.</p>' +
			'<p>Una vez finalizado, podr&aacute; continuar con el flujo normal en la p&aacute;gina actual.</p><br>&nbsp;</div>';
		return loadingModal;
	}
})