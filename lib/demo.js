/**
 * Imprime salida del servicio
 * */
function printResponse(containerName, response){
    var spanText;
    //Si hubo respuesta
    if(response){
        spanText = JSON.stringify(response);
    }else{
        spanText = 'No hay respuesta!';
    }
    //Agrega el resultado a la pagina
    $(containerName).text(spanText);
}