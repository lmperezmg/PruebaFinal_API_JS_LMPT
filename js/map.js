var mapMain;
var tb;
var dojoConfig = { parseOnLoad: true };
require(["esri/map",
    "esri/tasks/locator",
    "esri/geometry/Extent", 
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/FeatureLayer",
    "esri/symbols/TextSymbol",
    "esri/symbols/Font",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/dijit/PopupTemplate",
    "esri/dijit/Legend",
    "esri/dijit/BasemapGallery",
    "esri/dijit/OverviewMap",
    "esri/dijit/Scalebar",
    "esri/dijit/Search",
    "esri/toolbars/draw",
    "esri/graphic",
    "dojo/dom",
    "dojo/on",
    "dojo/_base/Color",
    "dojo/_base/array",
    "dijit/TitlePane",
    "dijit/layout/TabContainer",
    "dijit/layout/ContentPane",
    "dijit/layout/BorderContainer"],
    function (
    Map,
    Locator,
    Extent, 
    ArcGISDynamicMapServiceLayer,
    FeatureLayer,
    TextSymbol,
    Font,
    SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol,
    PopupTemplate,
    Legend,
    BasemapGallery,
    OverviewMap,
    Scalebar,
    Search,
    Draw,
    Graphic, 
    dom,
    on,
    Color,
    array

    ) {


    on(dojo.byId("pintaYQuery"), "click", fPintaYQuery);
    /* Evento click para buscar la localización */
    on(dojo.byId("progButtonNode"), "click", fQueryEstados);

    /* Tarea del localizador, que llama al método al escribir la dirección */
    var taskLocator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
    taskLocator.on("address-to-locations-complete", doAddressToLocations);

    /* Completamos la función de pintar */
    function fPintaYQuery() {        
        var tbDraw = new Draw(mapMain);
        tbDraw.on("draw-end", displayPolygon);
        tbDraw.activate(Draw.POLYGON);
    }
    /* Dibujamos el polígono */
    function displayPolygon(evt) {
        // Get the geometry from the event object
        var geometryInput = evt.geometry;

        // Define symbol for finished polygon
        var tbDrawSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 255, 0]), 2), new Color([255, 255, 0, 0.2]));

        // Clear the map's graphics layer
        mapMain.graphics.clear();

        /*
            * Step: Construct and add the polygon graphic
            */
        var graphicPolygon = new Graphic(geometryInput, tbDrawSymbol);
        mapMain.graphics.add(graphicPolygon);
    }
    
    /* Función a la que llama el botón del localizador. Se obtiene el dato introducido y se ejecuta la tarea */
    function fQueryEstados() {
        mapMain.graphics.clear();

        /*
        * Step: Complete the Locator input parameters
        */
        var objAddress = {
            "SingleLine": dom.byId("dtb").value
        }
        var params = {
            address: objAddress,
            outFields: ["*"]
        }

        /*
        * Step: Execute the task
        */
        taskLocator.addressToLocations(params);
    }

    function doAddressToLocations(candidates) {
        // Define the symbology used to display the results
        var symbolMarker = new SimpleMarkerSymbol();
        symbolMarker.setStyle(SimpleMarkerSymbol.STYLE_SOLID);
        symbolMarker.setColor(new Color("red"));
        var font = new Font("14pt", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, "Helvetica");

        // loop through the array of AddressCandidate objects
        var geometryLocation;
        array.forEach(candidates.addresses, function (candidate) {
            // Si el candidato es la region que hemos escrito y es un estado o provincia, lo localizaremos
            if (candidate.attributes.Region == dom.byId("dtb").value && candidate.attributes.Type == "State or Province") {
                // retrieve attribute info from the candidate
                var attributesCandidate = {
                    address: candidate.address,
                    score: candidate.score,
                    locatorName: candidate.attributes.Loc_name,
                    region: candidate.attributes.Region
                };
                /* Step: Retrieve the result's geometry */
                geometryLocation = candidate.location;
                /* Step: Display the geocoded location on the map */
                var graphicResult = new Graphic(geometryLocation, symbolMarker, attributesCandidate);
                mapMain.graphics.add(graphicResult);
                // display the candidate's address as text
                var sAddress = candidate.address;
                var textSymbol = new TextSymbol(sAddress, font, new Color("#FF0000"));
                textSymbol.setOffset(0, -22);
                mapMain.graphics.add(new Graphic(geometryLocation, textSymbol));
                // exit the loop after displaying the first good match
                return false;
            }
        });
        // Center and zoom the map on the result
        if (geometryLocation !== undefined) {
            mapMain.centerAndZoom(geometryLocation, 6);
        }
    }

    /*
    * Centramos la extensión del inicio del mapa
    */
    var extentInitial = new Extent ({
        "xmin":-13859281.202317288,
        "ymin":4233028.228520631,
        "xmax":-13150557.076057168,
        "ymax":4812115.154809098,
        "spatialReference": {
            "wkid":102100
        }
    })

    mapMain = new Map("map", {
        basemap: "topo",
        center: [-150.0002800,  64.0002800], // long, lat
        zoom: 4,                        
        extent: extentInitial
    });

    mapMain.on("load", function (evt) {
        mapMain.resize();
        mapMain.reposition();

    });
    
    /*
        Añadir el MapServer con los datos de EEUU
    */
    var sUrlUSAService = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer"; 
    var lyrUSA = new ArcGISDynamicMapServiceLayer(sUrlUSAService, {opacity : 0.5});
    mapMain.addLayer(lyrUSA);

    /* Añadimos la leyenda */   
    var dijitLegend = new Legend({
        map : mapMain,
        arrangement : Legend.ALIGN_LEFT
    }, "legendDiv");
    dijitLegend.startup();
    
    /* Añadimos búsqueda */
    var dijitSearch= new Search({
        map : mapMain,
        autoComplete : true
    }, "divSearch");
    dijitSearch.startup();

    /* Añadimos galería de mapas base */
    var basemapGallery = new BasemapGallery({
        showArcGISBasemaps: true,
        map: mapMain
    }, "basemapGallery");
    basemapGallery.startup();

    /* Añadimos vista general */
    var overviewMapDijit = new OverviewMap({
        map: mapMain,
        visible: true,
        height: 120,
        width: 120,
        attachTo: "bottom-left",
    });
    overviewMapDijit.startup();

    /* Añadimos barra de escala */
    var scalebar = new Scalebar({
        map: mapMain,
        attachTo: "bottom-center"    
    });
    scalebar.show();

    /* Popup con los datos de población, población sqmi y área */
    var popUp = new PopupTemplate({
        "title": "Estadpo de {state_name}, {state_abbr}",
        "description": "Población: {pop2000}<br>{state_abbr} Población por sqmi: {pop00_sqmi} <br>Área en sqmi: {shape}",
    }); 
    /* Datos a mostrar */
    var outFieldsQuakes = ["state_name","state_abbr", "pop2000", "pop00_sqmi", "shape"];
    /* Información del condado (FeatureLayer con el identificador 2 del MapServer)  */
    var fl = new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2", {
        outFields: outFieldsQuakes,
        infoTemplate: popUp
    });
    mapMain.addLayers([lyrUSA, fl]);

    });

