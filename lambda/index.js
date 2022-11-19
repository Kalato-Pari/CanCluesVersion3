/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');

var persistenceAdapter = getPersistenceAdapter();
var estadoPartida = 0;
var pregunta = 0;
var desbug = "Funciona otra vezzzz"
var objetoUno
var objetoDos
var objetoTres
var pista;
var intentos = 0;
var ultimo;

function getPersistenceAdapter() {
    // This function is an indirect way to detect if this is part of an Alexa-Hosted skill
    function isAlexaHosted() {
        return process.env.S3_PERSISTENCE_BUCKET ? true : false;
    }
    const tableName = 'can_clues_table';
    if(isAlexaHosted()) {
        const {S3PersistenceAdapter} = require('ask-sdk-s3-persistence-adapter');
        return new S3PersistenceAdapter({ 
            bucketName: process.env.S3_PERSISTENCE_BUCKET
        });
    } else {
        // IMPORTANT: don't forget to give DynamoDB access to the role you're to run this lambda (IAM)
        const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
        return new DynamoDbPersistenceAdapter({ 
            tableName: tableName,
            createTable: true
        });
    }
}

const LoadAttributesRequestInterceptor = {
    async process(handlerInput) {
        if(handlerInput.requestEnvelope.session['new']){ //is this a new session?
            const {attributesManager} = handlerInput;
            const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
            //copy persistent attribute to session attributes
            handlerInput.attributesManager.setSessionAttributes(persistentAttributes);
        }
    }
};

const SaveAttributesResponseInterceptor = {
    async process(handlerInput, response) {
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession);//is this a session end?
        if(shouldEndSession || handlerInput.requestEnvelope.request.type === 'SessionEndedRequest') { // skill was stopped or timed out            
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
        }
    }
};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        let speakOutput = '';
        
        if(estadoPartida === 0){
        speakOutput = `Bienvenido a Can Clues, ¿quieres iniciar una partida?`
        }else{
            speakOutput = 'Bienvenido a Can Clues. Hay una partida guardada, ¿quieres continuar?'
            pregunta = 11
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const YesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
    },
    handle(handlerInput) {
        let speakOutput = '';
        
        if(estadoPartida === 0 && pregunta === 0){
            speakOutput = `Durante este juego tendrás que usar algunos objetos y tomar decisiones que afectarán el rumbo de la historia, para decidir qué opción tomar sólo tienes que decir uno o dos... Comienza el juego 
            <voice name="Lupe"> <amazon:domain name="news"> <audio src="soundbank://soundlibrary/radios_static/radios_static_06"/> La hija de Isao Okada, el dueño de la fábrica más grande de nuestra ciudad, ha desaparecido este 9 de abril. Su nombre es Hana Okada, lo último que se sabe de ella es que iba en camino a su casa después de la escuela, pero nunca llegó. Se rastreó su celular y su más reciente localización indica que estaba en el bosque Kokura... </amazon:domain> </voice> <audio src="soundbank://soundlibrary/radios_static/radios_static_06"/>
            Silencias el radio, eres el nuevo detective del pueblo y te han asignado al caso, ahora mismo te diriges en un auto a aquel bosque. 
            Vas junto a tu fiel compañero canino, Scraps. 
            Eres una persona cuyo único interés es tu trabajo a excepción de tu canino Scraps, el cual desde que lo obtuviste has dedicado mucho tiempo a entrenar para seguir tus comandos y ayudar en tu trabajo. 
            Al llegar bajas de tu auto junto a Scraps e inspeccionas tu cajuela; tienes una mochila pero ésta sólo tiene espacio para 3 objetos. Los objetos son: linterna, batería portátil, botiquín, cinta métrica, grabadora y rompe candados.
            ¿Qué te gustaría llevar? Sólo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`
            
            pista = "En la radio escuché que se rastreó su celular y su más reciente localización indica que estaba en el bosque Kokura..."
            
            ultimo = `Tienes una mochila pero ésta sólo tiene espacio para 3 objetos. Los objetos son: linterna, batería portátil, botiquín, cinta métrica, grabadora y rompe candados.
            ¿Qué te gustaría llevar? Sólo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`
            
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(`Tienes una mochila pero ésta sólo tiene espacio para 3 objetos. Los objetos son: linterna, batería portátil, botiquín, cinta métrica, grabadora y rompe candados.
            ¿Qué te gustaría llevar? Sólo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`)
            .getResponse();
        }else if(estadoPartida === 1 && pregunta === 0){
            const {attributesManager} = handlerInput;
            const sessionAttributes = attributesManager.getSessionAttributes();
            
            estadoPartida = sessionAttributes['estadoPartida'];
            pregunta = sessionAttributes['pregunta'];
            objetoUno = sessionAttributes['objetoUno']
            objetoDos = sessionAttributes['objetoDos']
            objetoTres = sessionAttributes['objetoTres']
            pista = sessionAttributes['pista']
            intentos = sessionAttributes['intentos'];
            ultimo = sessionAttributes['ultimo']
            speakOutput = 'Continuarás donde te quedaste. ' + ultimo
            
            
        }else if(pregunta === 1){ //para selecionar el inventario
            pregunta = 2
            speakOutput = `Se han agregado ${objetoUno}, ${objetoDos} y ${objetoTres} al inventario.
            Con todo listo te decides a entrar al bosque, caminas sin rumbo por un rato sin encontrar nada, de repente Scraps insiste en ir a una dirección en particular.
            ¿Qué quieres hacer?
            Uno. Seguir buscando donde estás.
            Dos. Seguir a Scraps.`;
            estadoPartida = 1
            ultimo = speakOutput
        }else if(pregunta === 10){
            speakOutput = "Como no sabes el PIN, no puedes continuar con tu investigación y el caso queda sin resolver... !Has perdido! ¿Quieres volver a intentarlo?"
            pregunta = 11
        }else if(pregunta === 11){
            estadoPartida = 0
            pregunta = 0
            intentos = 0
            pista = ""
            objetoUno = ""
            objetoDos = ""
            objetoTres = ""
            ultimo = ""
            speakOutput = `Durante este juego tendrás que usar algunos objetos y tomar decisiones que afectarán el rumbo de la historia, para decidir qué opción tomar sólo tienes que decir uno o dos... Comienza el juego 
            <voice name="Lupe"> <amazon:domain name="news"> <audio src="soundbank://soundlibrary/radios_static/radios_static_06"/> La hija de Isao Okada, el dueño de la fábrica más grande de nuestra ciudad, ha desaparecido este 9 de abril. Su nombre es Hana Okada, lo último que se sabe de ella es que iba en camino a su casa después de la escuela, pero nunca llegó. Se rastreó su celular y su más reciente localización indica que estaba en el bosque Kokura... </amazon:domain> </voice> <audio src="soundbank://soundlibrary/radios_static/radios_static_06"/>
            Silencias el radio, eres el nuevo detective del pueblo y te han asignado el caso, ahora mismo te diriges en un auto a aquel bosque. 
            Vas junto a tu fiel compañero canino, Scraps. 
            Eres una persona cuyo único interés es tu trabajo a excepción de tu canino Scraps, el cual desde que lo obtuviste has dedicado mucho tiempo a entrenar para seguir tus comandos y ayudar en tu trabajo. 
            Al llegar bajas de tu auto junto a Scraps e inspeccionas tu cajuela; tienes una mochila pero ésta sólo tiene espacio para 3 objetos. Los objetos son: linterna, batería portátil, botiquín, cinta métrica, grabadora y rompe candados.
            ¿Qué te gustaría llevar? Sólo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`
            
            pista = "En la radio escuché que se rastreó su celular y su más reciente localización indica que estaba en el bosque Kokura..."
            
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(`Tienes una mochila pero ésta sólo tiene espacio para 3 objetos. Los objetos son: linterna, batería portátil, botiquín, cinta métrica, grabadora y rompe candados.
                ¿Qué te gustaría llevar? Sólo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`)
                .getResponse();
            
        } else if(pregunta === 13){
            if(objetoUno === "rompe candados" || objetoUno === "rompe candado"){
                objetoUno = ""
            }
            if(objetoDos === "rompe candados" || objetoDos === "rompe candado"){
                objetoDos = ""
            }
            if(objetoTres === "rompe candados" || objetoTres === "rompe candado"){
                objetoTres = ""
            }
            speakOutput= `<audio src="soundbank://soundlibrary/clocks/clock/clock_01"/> <audio src="soundbank://soundlibrary/home/amzn_sfx_door_open_01"/> Se abrió la puerta y antes de entrar le das a Scraps la instrucción de Cuidar por lo que se queda afuera mirando los alrededores. Una vez que entras observas a Hanna amarrada en una silla, comienzas a desatarla
            <audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_2x_03"/>
            Le dices a Hana que se quede dentro pues podría ser peligroso y sales para ver a Scraps, no sin antes de que Hana te advierta de que podría ser Ryo.
            <voice name="Miguel">  ¡Deja a Hana! Ya ha sido escogida, sólo faltan unas horas para que se complete el pacto ¿no lo entiendes?, sólo hay una forma de salir y ella es la clave para liberarme <audio src="soundbank://soundlibrary/human/amzn_sfx_laughter_giggle_02"/>
            El bosque controla tu mente y tu cuerpo, las otras personas se rindieron, pero yo traje un reemplazo así que me iré. 
            Si quieres intenta irte, a mi no me interesa lastimarte, el bosque ya me dijo que alguno de los dos se tiene que quedar. <audio src="soundbank://soundlibrary/human/amzn_sfx_laughter_giggle_02"/> </voice>
            Piensas que está loco y regresas para tomar a Hanna, pero al intentar salir de la cabaña, el bosque comienza bloquear tu camino con la maleza pero también escuchas sonidos aterradores. Entonces crees en la historia de Ryo.
            <voice name="Miguel"> El bosque Kokura ya te demostró de qué es capaz, deberías comenzar a elegir quién se irá. </voice> ¿Quién debería irse?
            Uno. Se irá Hanna.
            Dos. Te irás tú`
            intentos = 0
            ultimo = speakOutput
            pregunta = 15
        } else if(pregunta === 14){
            speakOutput = "Como no sabes la contraseña, no puedes continuar con tu investigación y el caso queda sin resolver... !Has perdido! ¿Quieres volver a intentarlo?"
            pregunta = 11
        } else {
            speakOutput = "Eso no es una respuesta válida"
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
}

const NoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent';
    },
    handle(handlerInput) {
        let speakOutput = '';
        
        if(estadoPartida === 0 && pregunta === 0){
            speakOutput = `Adiós`
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
        }else if(estadoPartida === 1 && pregunta === 0){
            speakOutput = 'Empezarás desde el principio. '
            estadoPartida = 0
            pregunta = 0
            intentos = 0
            pista = ""
            objetoUno = ""
            objetoDos = ""
            objetoTres = ""
            ultimo = ""
            speakOutput = speakOutput + `Durante este juego tendrás que usar algunos objetos y tomar decisiones que afectarán el rumbo de la historia, para decidir qué opción tomar sólo tienes que decir uno o dos... Comienza el juego 
            <voice name="Lupe"> <amazon:domain name="news"> <audio src="soundbank://soundlibrary/radios_static/radios_static_06"/> La hija de Isao Okada, el dueño de la fábrica más grande de nuestra ciudad, ha desaparecido este 9 de abril. Su nombre es Hana Okada, lo último que se sabe de ella es que iba en camino a su casa después de la escuela, pero nunca llegó. Se rastreó su celular y su más reciente localización indica que estaba en el bosque Kokura... </amazon:domain> </voice> <audio src="soundbank://soundlibrary/radios_static/radios_static_06"/>
            Silencias el radio, eres el nuevo detective del pueblo y te han asignado el caso, ahora mismo te diriges en un auto a aquel bosque. 
            Vas junto a tu fiel compañero canino, Scraps. 
            Eres una persona cuyo único interés es tu trabajo a excepción de tu canino Scraps, el cual desde que lo obtuviste has dedicado mucho tiempo a entrenar para seguir tus comandos y ayudar en tu trabajo. 
            Al llegar bajas de tu auto junto a Scraps e inspeccionas tu cajuela; tienes una mochila pero ésta sólo tiene espacio para 3 objetos. Los objetos son: linterna, batería portátil, botiquín, cinta métrica, grabadora y rompe candados.
            ¿Qué te gustaría llevar? Sólo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`
            
            pista = "En la radio escuché que se rastreó su celular y su más reciente localización indica que estaba en el bosque Kokura..."
            
        }else if(pregunta === 1){ 
            speakOutput = `Tienes una mochila pero ésta sólo tiene espacio para 3 objetos. Los objetos son: linterna, batería portátil, botiquín, cinta métrica, grabadora y rompe candados.
            ¿Qué te gustaría llevar? Sólo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`;
            ultimo = speakOutput
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
        } else if(pregunta === 10){
            speakOutput = "¿Cuál es el pin?"
            ultimo = speakOutput
            pregunta = 9
        }else if(pregunta === 11){
            speakOutput = "Adiós"
            estadoPartida = 0
            pregunta = 0
            intentos = 0
            pista = ""
            objetoUno = ""
            objetoDos = ""
            objetoTres = ""
            ultimo = ""
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
        }else if(pregunta === 13 || pregunta === 14){
            speakOutput = "¿Cuál es la contraseña?"
            ultimo = speakOutput
            pregunta = 12
        } else {
            speakOutput = "Eso no es una respuesta válida"
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
    }
};

const ObjetoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ObjetoIntent';
    },
    handle(handlerInput) {
        let speakOutput = ''
        
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        
        objetoUno = handlerInput.requestEnvelope.request.intent.slots.objetoUno.value
        objetoDos = handlerInput.requestEnvelope.request.intent.slots.objetoDos.value
        objetoTres = handlerInput.requestEnvelope.request.intent.slots.objetoTres.value
        
        if(objetoUno && objetoDos && objetoTres){
            if(objetoDos !== objetoUno && objetoDos !== objetoTres && objetoTres !== objetoUno){
                speakOutput = `¿Estás seguro de que quieres llevar estos objetos?`
                ultimo = speakOutput
                pregunta = 1
            } else {
                speakOutput = `Tienes que elegir tres objetos diferentes`
                ultimo = speakOutput
            }
        }else{
            speakOutput = "Tienes que darme tres objetos"
            ultimo = speakOutput
        }
        
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
}

const CandadoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CandadoIntent';
    },
    handle(handlerInput) {
        intentos = intentos + 1
        let speakOutput = '';
        const primero = handlerInput.requestEnvelope.request.intent.slots.primero.value
        const segundo = handlerInput.requestEnvelope.request.intent.slots.segundo.value
        const tercero = handlerInput.requestEnvelope.request.intent.slots.tercero.value
        const cuarto = handlerInput.requestEnvelope.request.intent.slots.cuarto.value
        
        if(pregunta === 9){
            if(primero !== "0" || segundo !== "3" || tercero !== "1" || cuarto !== "0"){
                if((objetoUno === "grabadora" || objetoDos === "grabadora" || objetoTres === "grabadora") && intentos === 1){
                    speakOutput = `Te voy a dar una pista. Tienes una grabadora y has guardado lo siguiente. ` + pista + `¿Cuál es el PIN? Puedes repetir lo que dice la grabadora diciendo reproducir`
                }else if ((objetoUno === "grabadora" || objetoDos === "grabadora" || objetoTres === "grabadora") && intentos === 2){
                    speakOutput = `Te voy a dar una pista. Ves que el celular tiene muchas llamadas perdidas de Mamá y Papá por lo que lo más probable es que sea de Hana. ¿Cuál es el PIN?`
                    
                }else if(intentos === 1){
                    speakOutput = `Te voy a dar una pista. Ves que el celular tiene muchas llamadas perdidas de Mamá y Papá por lo que lo más probable es que sea de Hana. ¿Cuál es el PIN?`
                    
                }else if(intentos === 2){
                    speakOutput = `Te voy a dar una pista. Hana es muy olvidadiza y siempre anota sus contraseñas, las suele guardar en sus pertenencias. ¿Cuál es el PIN?`
                    
                }else if (intentos % 5 !== 0){
                    speakOutput = `No funcionó, intenta otro pin`
                    
                }else {
                    speakOutput = "¿Quieres rendirte? Perderías el juego"
                    pregunta = 10
                }
            }else{
                speakOutput = `Empiezas a buscar en el celular, el último mensaje que no se alcanzó a enviar es... Mamá, ¡AYÚDAME!, es un hombre muy grande que dice cosas muy extrañas, que nunca me dejará ir porque después del quinto atardecer seré parte del bosque...
                Te sorprendes demasiado, pero no entiendes el mensaje, es un poco extraño <audio src="soundbank://soundlibrary/voices/human/human_06"/>
                Scraps levanta sus orejas y le das la instrucción de que guíe, trata de averiguar el camino correcto ya que los gritos son constantes y más fuertes conforme se acercan, hasta que llegas a una cabaña.
                Te acercas con sigilo, tratas de abrir la puerta rápidamente <audio src="soundbank://soundlibrary/doors/doors_knocks/knocks_06"/> Pero hay un candado con una clave de seis letras. ¿Cuál es la contraseña?`
                ultimo = speakOutput
                
                intentos = 0
            }
            
            
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const UnoDosIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'UnoDosIntent';
    },
    handle(handlerInput) {
        
        const numero = handlerInput.requestEnvelope.request.intent.slots.numero.value
        
        let speakOutput = '';
        
        if((pregunta === 2 || pregunta === 4 || pregunta === 5 || pregunta === 7 || pregunta === 6 || pregunta === 15) && (numero < 1 || numero > 2)){
            speakOutput = "Sólo puedes escoger entre uno y dos."
        } else {
        
        switch(pregunta){
            case 2:
                if(numero === "1"){
                    speakOutput = `Sigues mirando alrededor y encuentras una huella fresca frente a ti que obviamente no es tuya, necesitas medirla para saber si es de un hombre o una mujer. Pero...`
                    ultimo = speakOutput
                    if(objetoUno === "cinta metrica" || objetoDos === "cinta metrica" || objetoTres === "cinta metrica" || objetoUno === "cinta" || objetoDos === "cinta" || objetoTres === "cinta" || objetoUno === "cinta métrica" || objetoDos === "cinta métrica" || objetoTres === "cinta métrica" ){
                        speakOutput = speakOutput + `Usas la cinta métrica y mides la huella, parece ser de hombre. ¡Qué raro!, la que desapareció es una chica, alguien más debe andar por aquí.`
                        pista = pista + "La huella que medí la huella, parece ser de hombre..."
                    }else {
                        speakOutput = speakOutput + ` ¡Lástima! No traes la cinta métrica, deberás seguir buscando.`
                    }
                    speakOutput = speakOutput + " Continuación próximamente en Can Clues 2.0. ¿Quiere intentarlo de nuevo?"
                    pregunta = 11
                } else {
                    speakOutput = `Scraps te guía hacia algo que está colgando de una rama, te acercas y observas que es un pedazo de tela, al parecer es de una blusa de mujer. Se escucha algo
                    <audio src="soundbank://soundlibrary/human/amzn_sfx_walking_on_grass_02"/>
                    <audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_2x_03"/> <audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_growl_01"/>
                    Scraps está avisando. ¿Qué quieres hacer?
                    Uno. Indicar a Scraps que ignore el sonido y darle a oler la prenda.
                    Dos. Dejar que Scraps te guíe hacia el sonido.`
                    ultimo = speakOutput
                    pregunta = 4
                }
            break;
            case 4:
                if(numero === "1"){
                    speakOutput = `Le das a Scraps el comando de “silencio” y le acercas la prenda a su nariz. Scraps procede a mover la cabeza de un lado a otro inspeccionando el olor para memorizarlo, comienza a olfatear el suelo e indica que debes ir por la derecha y decides seguirlo.
                    Después de caminar unos minutos, Scraps se detiene frente a un barranco. Te asomas y ves que hay una mochila en una parte sobresaliente que no es alcanzable con sólo estirar el brazo. Pero...`
                    
                    if(objetoUno === "cuerda" || objetoDos === "cuerda" || objetoTres === "cuerda"){
                        speakOutput = speakOutput + ` Usas la cuerda que hay en tu inventario para bajar. Rápidamente tomas la mochila y regresas con Scraps. 
                        Al buscar dentro de ella encuentras la identificación de Hana Okada y varios cuadernos. 
                        Empiezas a hojearlos, sólo hablan de varias materias escolares, de repente se cae una nota con el número 0310, pero no le encuentras significado por lo que continúas. Entre uno de los cuadernos encuentras un recorte de periódico que dice... <voice name="Lupe"> <amazon:domain name="news">¡Ha sucedido de nuevo! La leyenda local cuenta que una vez que entras al bosque Kokura no hay salida... </amazon:domain> </voice>
                        <audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_2x_03"/>
                        Scraps está avisando. ¿Qué quieres hacer? 
                        Uno. Dejar de leer y ver a qué le ladra Scraps.
                        Dos. Ignorar a Scraps y seguir leyendo.`
                        
                        pista = pista + "Abrí los cuadernos y se cayó una nota con el número 0310 pero no entiendo el significado, el periódico dice que nunca se puede salir de este bosque..." 
//AQUI LA ULTIMA PISTA QUE AGREGUE                        
                        pregunta = 5
                        ultimo = speakOutput
                    } else {
                        speakOutput = speakOutput + ` ¿Qué quieres hacer?
                        Uno. Irse pues no traes una cuerda.
                        Dos. Intentar bajar de todos modos.`
                        ultimo = speakOutput
                        pregunta = 6
                    }
                } else {
                    speakOutput = `Van hacia el sonido y logran ver la silueta de una persona que rápidamente se esconde entre la maleza. Intentas llamarle, pero la persona se sigue alejando de ti. <audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_growl_01"/> Scraps está muy inquieto. ¿Qué quieres hacer? 
                    Uno. Seguir a la persona sospechosa.
                    Dos. Irse del lugar pues podría ser peligroso.`
                    pista = pista + `Logré ver la silueta de una persona y en cuanto le llamé se fue...`
                    ultimo = speakOutput
                    pregunta = 7
                }
            break;
            case 5:
                if(numero === "1"){
                    speakOutput = `Escuchas nuevamente el sonido que proviene de las hierbas pero esta vez si decides averiguar quien es.
                    <audio src="soundbank://soundlibrary/footsteps/running/running_07"/> Inicia la persecución, mientras lo sigues vas chocando con varias ramas, pero, ¡qué extraño!, esta persona no choca con ninguna, es como si conociera el bosque.
                    Te das cuenta de que se trata de un hombre pues conforme te acercas observas que es alto y corpulento.
                    Scraps es más rápido y está a punto de atraparlo, pero de repente la persona se voltea y lo patea fuertemente antes de seguir corriendo, Scraps se queda tirado e inconsciente.
                    ¿Qué quieres hacer? 
                    Uno. Dejar a Scraps para perseguir al hombre.
                    Dos. Quedarte con Scraps dejando escapar al hombre.`
                    pista = pista + `La silueta que vi es un hombre sopechoso y violento...`
                    ultimo = speakOutput
                    pregunta = 8
                }else{
                    speakOutput = `Continúas leyendo... <voice name="Lupe"> <amazon:domain name="news">El día 9 de abril se vio por última vez a Ryo Tamura después de salir con sus amigos, la gente murmura que está en el bosque, pero los detectives se han negado a investigar...</amazon:domain> </voice> Un árbol que cae interrumpe tu lectura.
                    Scraps levanta sus orejas y le das la instrucción de que te guíe pues podría ser importante.
                    Llegas a donde el árbol se cayó pero… ¡Ah! Sólo es un castor.
                    Miras a tu alrededor y te das cuenta de que llegaste a un río, cuando te das la vuelta para irte, Scraps se regresa y encuentra unas huellas que se detienen en la orilla. 
                    Poniéndote en la misma posición y mirando el río te das cuenta que hay algo rectangular en el fondo. Metes la mano y sacas un celular, lo secas y tratas de encenderlo, pero no tiene batería.`
                    pista = pista + `El 9 de abril se perdió Ryo Tamura en este mismo bosque...`
                    ultimo = speakOutput
                    
                    if(objetoUno === "bateria portatil" || objetoDos === "bateria portatil" || objetoTres === "bateria portatil" || objetoUno === "bateria" || objetoDos === "bateria" || objetoTres === "bateria" || objetoUno === "batería portátil" || objetoDos === "batería portátil" || objetoTres === "batería portátil" || objetoUno === "batería" || objetoDos === "batería" || objetoTres === "batería"){
                        speakOutput = speakOutput + ` De inmediato lo conectas a la batería portátil que traes, esperas unos minutos antes de volver a intentar prenderlo.
                        Esta vez lo logras y el celular inicia, pero al intentar desbloquearlo te pide un pin de 4 dígitos.
                        ¿Cuál es el PIN?`
                        ultimo = speakOutput
                        pregunta = 9
                    }else {
                        speakOutput = speakOutput + ` ¡Lástima! No traes la batería portátil, deberás seguir buscando... Continuación próximamente en Can Clues 2.0 ¿Quieres volver a empezar?`
                        
                        pregunta = 11
                    }
                    
                }
            break;
            case 7:
                if(numero === "1"){
                    speakOutput = `<audio src="soundbank://soundlibrary/footsteps/running/running_07"/> Inicia la persecución, mientras lo sigues vas chocando con varias ramas, pero, ¡qué extraño!, esta persona no choca con ninguna, es como si conociera el bosque.
                    Te das cuenta de que se trata de un hombre pues conforme te acercas observas que es alto y corpulento.
                    Scraps es más rápido y está a punto de atraparlo, pero de repente la persona se voltea y lo patea fuertemente antes de seguir corriendo, Scraps se queda tirado e inconsciente.
                    ¿Qué quieres hacer? 
                    Uno. Dejar a Scraps para perseguir al hombre.
                    Dos. Quedarte con Scraps dejando escapar al hombre.`
                    ultimo = speakOutput
                    pista = pista + `La silueta que vi es un hombre sopechoso y violento...`
                    pregunta = 8
                } else {
                    speakOutput = `Le das a Scraps el comando de “silencio” y dejas ir a la persona.
                    Deciden regresar a donde habían encontrado la prenda y se la acercas a su nariz. 
                    Scraps procede a mover la cabeza de un lado a otro inspeccionando el olor para memorizarlo, comienza a olfatear el suelo e indica que debes ir por la derecha y decides seguirlo.
                    Después de caminar unos minutos, Scraps se detiene frente a un barranco. Te asomas y ves que hay una mochila en una parte sobresaliente que no es alcanzable con sólo estirar el brazo. Pero...`
                    
                    if(objetoUno === "cuerda" || objetoDos === "cuerda" || objetoTres === "cuerda"){
                        speakOutput = speakOutput + ` Usas la cuerda que hay en tu inventario para bajar. Rápidamente tomas la mochila y regresas con Scraps. 
                        Al buscar dentro de ella encuentras la identificación de Hana Okada y varios cuadernos. 
                        Empiezas a hojearlos, sólo hablan de varias materias escolares, de repente se cae una nota con el número 0310, pero no le encuentras significado por lo que continúas. Entre uno de los cuadernos encuentras un recorte de periódico que dice... <voice name="Lupe"> <amazon:domain name="news">¡Ha sucedido de nuevo! La leyenda local cuenta que una vez que entras al bosque Kokura no hay salida...</amazon:domain> </voice>
                        <audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_2x_03"/>
                        Scraps está avisando. ¿Qué quieres hacer? 
                        Uno. Dejar de leer y ver a qué le ladra Scraps.
                        Dos. Ignorar a Scraps y seguir leyendo.`
                        ultimo = speakOutput
                        pista = pista + "Abrí los cuadernos y se cayó una nota con el número 0310 pero no entiendo el significado, el periódico dice que nadie sale de este bosque ..."
                        pregunta = 5
                    } else {
                        speakOutput = speakOutput + ` ¿Qué quieres hacer?
                        Uno. Irse pues no traes una cuerda.
                        Dos. Intentar bajar de todos modos.`
                        ultimo = speakOutput
                        pregunta = 6
                    }
                }
            break;
            case 6:
                if(numero === "1"){
                    speakOutput = speakOutput + " Continuación próximamente en Can Clues 2.0. ¿Quiere intentarlo de nuevo?"
                    pregunta = 11
                }else{
                    speakOutput = "Te las arreglas para bajar, pero cuando estás a punto de llegar a la mochila te das cuenta de que ya no tienes de dónde sujetarte y ya no puedes regresar. Scraps llora mientras tú pierdes fuerza. Cuando ya no puedes más te dejas ir y… ¡Has perdido! ¿Quieres intentarlo de nuevo?"
                    pregunta = 11
                }
            break;
            case 8:
                if(numero === "1"){
                    speakOutput = "A pesar de que es tu mejor amigo, lo abandonas y continúas persiguiendo al hombre lo que causa que entre en pánico. Corre erráticamente y termina por escaparse, miras a tu alrededor y te das cuenta de que no tienes ni idea de dónde estás, gritas por ayuda, pero nadie te escucha, y piensas que recibes un castigo por alejarte de lo más importante para ti, Scraps se quedará solo, entonces lentamente cierras los ojos y… ¡Has perdido! ¿Quieres intentarlo otra vez?"
                    pregunta = 11
                } else {
                    speakOutput = "Ves como el hombre se aleja, pero te concentras en Scraps, comienzas a hablarle y despierta, notas que no puede caminar bien. Pero..."
                    if(objetoUno === "botiquín" || objetoDos === "botiquín" || objetoTres === "botiquín" || objetoUno === "botiquin" || objetoDos === "botiquin" || objetoTres === "botiquin"){
                        speakOutput = speakOutput + "Usas el botiquín que tienes en el inventario y Scraps se recupera como si no le hubiera sucedido nada, así que podrá seguir ayudándote."
                    }else{
                        speakOutput = speakOutput + "Lamentablemente no tienes con qué curarlo, tardará un rato en recuperarse y no podrá ayudarte. Continuación próximamente en Can Clues 2.0. ¿Quiere intentarlo de nuevo?"
                    }
                }
                pregunta = 11
            break;
            case 9:
                speakOutput = "Dame el pin de una sola vez"
            break;
            case 15:
                if(numero === "1"){
                    speakOutput = "Decides que Hanna debe irse, porque sabes que es lo correcto. Te despides y lloras al ver a tu fiel compañero Scraps, él comienza a insistir en quedarse contigo pero le das la última instrucción que es sacar a Hanna del bosque, siempre ha sido un canino fiel así que te obedece, mientras que a Hanna le encargas cuidarlo. Ves como se alejan, te resignas a no hacer lo mismo que Ryo pues eres un detective, comienza el atardecer y te desvaneces pero Ryo logra salir. ¡El juego ha terminado, has logrado llegar al final! ¿Quieres volver a jugar?"
                    pregunta = 11
                } else {
                    speakOutput = `El miedo te ha paralizado, el ser detective queda en segundo término después de lo que has presenciado. Te disculpas con Hanna y ella comienza a llorar, evitas verla a los ojos. Tomas a Scraps a la fuerza pues él quiere ayudarla pero lo obligas a salir del bosque contigo.
                    Han pasado unos días, la conciencia no te deja en paz, has fallado como detective y ser humano, crees que no eres digno de estar con Scraps así que lo das a una familia que si lo merezca. Esta culpa te acompaña hasta el fin de tus días. ¡El juego ha terminado, has logrado llegar al final! ¿Quieres volver a jugar?`
                    pregunta = 11
                }
            break;
            default:
                speakOutput = "Eso no es una respuesta válida"
            break;
        }
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
}

const ReproducirIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ReproducirIntent';
    },
    handle(handlerInput) {
        const speakOutput = pista + "¿Cuál es el contraseña?";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const PuertaIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PuertaIntent';
    },
    handle(handlerInput) {
        intentos = intentos + 1
        let speakOutput = '';
        
        const primera = handlerInput.requestEnvelope.request.intent.slots.primera.value
        const segunda = handlerInput.requestEnvelope.request.intent.slots.segunda.value
        const tercera = handlerInput.requestEnvelope.request.intent.slots.tercera.value
        const cuarta = handlerInput.requestEnvelope.request.intent.slots.cuarta.value
        const quinta = handlerInput.requestEnvelope.request.intent.slots.quinta.value
        const sexta = handlerInput.requestEnvelope.request.intent.slots.sexta.value
        
        if((primera === "K" || primera === "k") && (segunda === "O" || segunda === "o") && (tercera === "K" || tercera === "k") && (cuarta === "U" || cuarta === "u") && (quinta === "R" || quinta === "r") && (sexta === "A" || sexta === "a")){
            speakOutput= `<audio src="soundbank://soundlibrary/clocks/clock/clock_01"/> <audio src="soundbank://soundlibrary/home/amzn_sfx_door_open_01"/> Se abrió la puerta y antes de entrar le das a Scraps la instrucción de Cuidar por lo que se queda afuera mirando los alrededores. Una vez que entras observas a Hanna amarrada en una silla, comienzas a desatarla
            <audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_2x_03"/>
            Le dices a Hana que se quede dentro pues podría ser peligroso y sales para ver a Scraps, no sin antes de que Hana te advierta de que podría ser Ryo.
            <voice name="Miguel">  ¡Deja a Hana! Ya ha sido escogida, sólo faltan unas horas para que se complete el pacto ¿no lo entiendes?, sólo hay una forma de salir y ella es la clave para liberarme <audio src="soundbank://soundlibrary/human/amzn_sfx_laughter_giggle_02"/>
            El bosque controla tu mente y tu cuerpo, las otras personas se rindieron, pero yo traje un reemplazo así que me iré. 
            Si quieres intenta irte, a mi no me interesa lastimarte, el bosque ya me dijo que alguno de los dos se tiene que quedar. <audio src="soundbank://soundlibrary/human/amzn_sfx_laughter_giggle_02"/> </voice>
            Piensas que está loco y regresas para tomar a Hanna, pero al intentar salir de la cabaña, el bosque comienza bloquear tu camino con la maleza pero también escuchas sonidos aterradores. Entonces crees en la historia de Ryo.
            <voice name="Miguel"> El bosque Kokura ya te demostró de qué es capaz, deberías comenzar a elegir quién se irá. </voice> ¿Quién debería irse?
            Uno. Se irá Hanna.
            Dos. Te irás tú`
            ultimo = speakOutput
            pregunta = 15
        } else if(intentos === 1 && (objetoUno === "grabadora" || objetoDos === "grabadora" || objetoTres === "grabadora")){
            speakOutput = `<audio src="soundbank://soundlibrary/clocks/clock/clock_01"/> No se abrió, te voy a dar una pista. Tienes una grabadora y has guardado lo siguiente. ` + pista + `¿Cuál es la contraseña? Puedes repetir lo que dice la grabadora diciendo reproducir`
            
            
        } else if((intentos === 1 || intentos === 2) && (objetoUno === "rompe candados" || objetoDos === "rompe candados" || objetoTres === "rompe candados" || objetoUno === "rompe candado" || objetoDos === "rompe candado" || objetoTres === "rompe candado")){
            speakOutput = `<audio src="soundbank://soundlibrary/clocks/clock/clock_01"/> No se abrió, tienes un rompe candados en mal estado por lo que sólo puedes usarlo una vez, ¿quieres usarlo ahora?`
            
            pregunta = 13
        } else if (intentos === 2){
            speakOutput = `<audio src="soundbank://soundlibrary/clocks/clock/clock_01"/> No se abrió, te voy a dar una pista. La contraseña salió en el periódico.`
           
            
        } else if (intentos % 5 !== 0){
            speakOutput = `<audio src="soundbank://soundlibrary/clocks/clock/clock_01"/> El candado no se abre, intenta de nuevo`
            
        } else {
            speakOutput = "¿Quieres rendirte? Perderías el juego"
            pregunta = 14
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};


const IniciarIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'IniciarIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        
        sessionAttributes['estadoPartida'] = estadoPartida
        sessionAttributes['pregunta'] = pregunta
        sessionAttributes['intentos'] = intentos
        sessionAttributes['pista'] = pista
        sessionAttributes['objetoUno'] = objetoUno
        sessionAttributes['objetoDos'] = objetoDos
        sessionAttributes['objetoTres'] = objetoTres
        sessionAttributes['ultimo'] =ultimo
        
        const speakOutput = 'Adiós';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = ultimo;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        YesIntentHandler,
        NoIntentHandler,
        ObjetoIntentHandler,
        UnoDosIntentHandler,
        CandadoIntentHandler,
        //OpcionIntentHandler,
        ReproducirIntentHandler,
        PuertaIntentHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(LoadAttributesRequestInterceptor)
    .addResponseInterceptors(SaveAttributesResponseInterceptor)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .withPersistenceAdapter(persistenceAdapter)
    .lambda();