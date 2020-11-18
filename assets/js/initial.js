$(document).ready(function(){
  var data = {
        project: ajax_call("data/basic.json"),
        taiwanLayer: ajax_call("data/taiwan.json")
      },
      map,
      html = {
        initialMainPageHtml: mainPageTemplate(data),
        listTabEvent: ""
      }

  data.project.forEach(function(element){
    html.listTabEvent += `<li><a href="#${element.name}">${element.name}</a></li>`
  })
  $("#listTab ul").append(html.listTabEvent)
  
  $("#listTab").on("click", "li a", function(){
    var target = $(this).attr("href").replace("#", "")
    if (target == "overview") {
      $("#main-content-part").html(html.initialMainPageHtml.html)
      setTimeout(function(){
        map = initialMap({
          id: 'map'
        })
        L.geoJSON(data.taiwanLayer, {
          filter: function(feature){
            if (Object.keys(html.initialMainPageHtml.output.county).includes(feature.properties["COUNTYNAME"])) {
              return true
            }
          },
          style: function(feature){
            return { fillColor: html.mapcolor, weight: 0, opacity: 1, fillOpacity: 0.4 }
          },
          onEachFeature: function(feature, layer){
            layer.bindTooltip(feature.properties["COUNTYNAME"] + "<br>累積調查次數：" + html.initialMainPageHtml.output.county[feature.properties["COUNTYNAME"]] + "次", {
              sticky: true,
              opacity: 1
            })
          }
        }).addTo(map)
        console.log(html.initialMainPageHtml)
      }, 1000)
    } else {

    }
  })

  // initial
  $('#listTab li a[href="#overview"]').click()
})

function mainPageTemplate(data){
  var input = {
    event: data.project.length,
    economic: 0,
    region: 0,
    county: {},
    agriType: 0
  }
  data.project.forEach(function(element){
    input.economic += element.totalEconomicLose / 10000
    input.region += element.mainAffectCounty.length
    element.mainAffectCounty.forEach(function(eachRegion){
      if (!input.county[eachRegion.name]) { input.county[eachRegion.name] = 0 }
      input.county[eachRegion.name] += 1
      input.agriType += eachRegion.crops.length
    })
  })
  var html = `
    <section class="counts pb-0" style="height: calc( 100vh - 125px ); padding-top: 10px;">
      <div class="container" data-aos="fade-up" style="max-width: unset">
        <div class="row">
          <div class="col-lg-9">
            <div class="row" style="padding-top: 20px;">
              <div class="col-lg-3 col-md-6">
                <div class="count-box">
                  <i class="icofont-page"></i>
                  <span data-toggle="counter-up">${input.event}</span>
                  <p>農損調查事件數</p>
                </div>
              </div>
              <div class="col-lg-3 col-md-6 mt-5 mt-md-0">
                <div class="count-box">
                  <i class="icofont-money"></i>
                  <span data-toggle="counter-up">${input.economic.toFixed(2)}</span>
                  <p>總經濟損失(億)</p>
                </div>
              </div>
              <div class="col-lg-3 col-md-6 mt-5 mt-lg-0">
                <div class="count-box">
                  <i class="icofont-google-map"></i>
                  <span data-toggle="counter-up">${input.region}</span>
                  <p>總災區次數(縣市)</p>
                </div>
              </div>
              <div class="col-lg-3 col-md-6 mt-5 mt-lg-0">
                <div class="count-box">
                  <i class="icofont-plant"></i>
                  <span data-toggle="counter-up">${input.agriType}</span>
                  <p>損失作物種類</p>
                </div>
              </div>
              <div class="col-lg-12 mt-2" style="height: calc( 100vh - 300px )">
              </div>
            </div>
          </div>
          <div class="col-lg-3">
            <div class="w-100 rounded shadow-lg" id="map" style="height: calc( 100vh - 140px )"></div>
          </div>
        </div>
      </div>
    </div>`
  return {
    html: html,
    output: input
  }
}

function initialMap(option){
  var map = L.map(option.id, {
    center: new L.LatLng(23.6962307, 121.0054591),
    zoom: 7,
    zoomSnap: 0.25,
    zoomControl: false
  })
  var baseMaps = {};
  baseMaps["Google Road"] = new L.tileLayer('https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i349018013!3m9!2sen-US!3sUS!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!4e0',{
      img: "https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i10!2i857!3i438!4i256!2m3!1e0!2sm!3i349018013!3m9!2sen-US!3sUS!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!4e0"
  });
  baseMaps["Google Mixed"] = new L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
      maxZoom: 22,
      subdomains:['mt0','mt1','mt2','mt3'],
      opacity: 1,
      img: "https://mt3.google.com/vt/lyrs=s,h&x=857&y=438&z=10"
  });
  baseMaps["Google Terrain"] = new L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
      maxZoom: 22,
      subdomains:['mt0','mt1','mt2','mt3'],
      opacity: 1,
      img: "https://mt3.google.com/vt/lyrs=p&x=857&y=438&z=10"
  });
  baseMaps["Google Road"].addTo(map);
  return map
}

function ajax_call(url){
  var result = null, scriptUrl = url;
  $.ajax({
    url: scriptUrl,
    type: 'get',
    dataType: 'json',
    async: false,
    success: function(data) {
      result = data;
    }
  });
  return result;
}

function modal_open(input){
  $("#atrr-info-modal .modal-title").html(input.title);
  $("#atrr-info-modal .modal-body").html(input.content);
  $("#atrr-info-modal").modal();
}