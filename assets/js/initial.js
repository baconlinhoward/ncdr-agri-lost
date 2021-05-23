$(document).ready(function(){
  var data = {
        project: ajax_call("data/basic.json").sort(function(a, b){
          return b.event.start - a.event.start
        }),
        taiwanLayer: ajax_call("data/taiwan.json")
      },
      map,
      html = {
        initialMainPageHtml: mainPageTemplate(data)
      },
      mouseMovingStatus = false,
      filterObject = {
        year: {
          data: [],
          html: '<option value="全部">全部</option>'
        },
        reason: {
          data: [],
          html: '<option value="全部">全部</option>'
        }
      }
  
  data.project.forEach(function(element){
    if (!filterObject.year.data.includes(element.year)) {
      filterObject.year.data.push(element.year)
      filterObject.year.html += `<option value="${element.year}">${element.year}</option>`
    }
    if (!filterObject.reason.data.includes(element.reason)) {
      filterObject.reason.data.push(element.reason)
      filterObject.reason.html += `<option value="${element.reason}">${element.reason}</option>`
    }
  })
  $('#projectFilterPanel select[target="year"]').html(filterObject.year.html)
  $('#projectFilterPanel select[target="reason"]').html(filterObject.reason.html)
  $('#projectFilterPanel select').change(function(){
    var query = {}, 
        filterData = {
          taiwanLayer: data.taiwanLayer
        }
    $('#projectFilterPanel select').each(function(){
      query[$(this).attr('target')] = $(this).val()
    })
    switch (true) {
      case (query.year === "全部" && query.reason === "全部"):
        filterData.project = data.project
        break;
      case (query.year === "全部" && query.reason !== "全部"):
        filterData.project = data.project.filter(el => { 
          return el.reason === query.reason
        })
        break;
      case (query.year !== "全部" && query.reason === "全部"):
        filterData.project = data.project.filter(el => { 
          return el.year === Number(query.year)
        })
        break;
      default:
        filterData.project = data.project.filter(el => { 
          return (el.year === Number(query.year) && el.reason === query.reason)
        })
    }
    html.initialMainPageHtml = mainPageTemplate(filterData)
    $('#listTab li a[href="#overview"]').click()
  })
  
  $("#listTab").on("click", "li a", function(){
    $("#listTab").scrollLeft($(this)[0].parentElement.offsetLeft-15);
    // UI control
    $("#listTab li").each(function(){
      $(this).removeClass("active")
    })
    $(this).parent("li").addClass("active")
    // handle
    var target = $(this).attr("href").replace("#", "")
    if (target == "overview") {
      $("#main-content-part").html(html.initialMainPageHtml.html)
      setTimeout(function(){
        map = initialMap({
          id: 'map',
          minZoom: 7,
          maxZoom: 7,
          basedMap: 'Google灰階街道',
          legend: '累積次數<br><i style="background: #800026"></i>40+<br><i style="background: #BD0026"></i>30-40<br><i style="background: #E31A1C"></i>20-30<br><i style="background: #FC4E2A"></i>15-20<br><i style="background: #FD8D3C"></i>10-15<br><i style="background: #FEB24C"></i>5-10<br><i style="background: #FED976"></i>1-5'
        })
        L.geoJSON(data.taiwanLayer, {
          filter: function(feature){
            if (Object.keys(html.initialMainPageHtml.output.county).includes(feature.properties["COUNTYNAME"])) {
              return true
            }
          },
          style: function(feature){
            return { fillColor: getColor(html.initialMainPageHtml.output.county[feature.properties["COUNTYNAME"]]), weight: 0, opacity: 1, fillOpacity: 0.7 }
          },
          onEachFeature: function(feature, layer){
            layer.bindTooltip(feature.properties["COUNTYNAME"] + "<br>累積影響次數：" + html.initialMainPageHtml.output.county[feature.properties["COUNTYNAME"]] + "次", {
              sticky: true,
              opacity: 1
            })
          }
        }).addTo(map)
        var tbodyHtml = ""
        html.initialMainPageHtml.project.project.forEach(function(element, index){
          tbodyHtml += `<tr class="c-pointer"><td>${timeConverter(element.event.start) + "~" + timeConverter(element.event.end)}</td><td>${element.reason}</td><td>${element.name}</td><td>${element.totalEconomicLose.value}萬</td><td>${element.estimatedRainAccumulation.value}mm</td></tr>`  
        })
        $("#table-overview").html(`
          <table class="table table-sm table-hover text-center w-100">
            <thead class="thead-dark">
              <tr><th>時間</th><th>類型</th><th>事件名稱</th><th>經濟損失</th><th>事件雨量</th></tr>
            </thead>
            <tbody>
              ${tbodyHtml}
            </tbody>
          </table>`
        )
        $("#table-overview tbody tr").click(function(){
          $('#listTab li a[href="#' + $(this).find('td').eq(2).html() + '"]').click()
        })
        searchTableInitial(true)
      }, 1000)
    } else {
      mouseMovingStatus = false
      var targetData = data.project.filter(function(element){
            return element.name == target
          })[0],
          targetCaseHtml = casePageTemplate(targetData)
      $("#main-content-part").html(targetCaseHtml.html)
      $('#caseDetailedPageInitial').click(function(){
        caseDetailedPageTemplate(targetCaseHtml.output)
        mouseMovingStatus = false
      })
      setTimeout(function(){
        map = initialMap({
          id: 'map',
          minZoom: 7,
          maxZoom: 7,
          basedMap: 'Google道路',
          legend: '<i style="background: red"></i>受影響區域'
        })
        L.geoJSON(data.taiwanLayer, {
          filter: function(feature){
            if (Object.keys(targetCaseHtml.output.county).includes(feature.properties["COUNTYNAME"])) {
              return true
            }
          },
          style: function(feature){
            return { fillColor: 'red', weight: 0, opacity: 1, fillOpacity: 0.7 }
          },
          onEachFeature: function(feature, layer){
            layer.bindTooltip(feature.properties["COUNTYNAME"] + "<br>影響作物：" + targetCaseHtml.output.county[feature.properties["COUNTYNAME"]].join("、"), {
              sticky: true,
              opacity: 1
            })
          }
        }).addTo(map)
      }, 1000)
      $("#main-content-part").off().mousewheel(function(e){
        if (!mouseMovingStatus && e.deltaY === -1) {
          mouseMovingStatus = true
          $('#caseDetailedPageInitial').click()
        }
      })
    }
  })

  // initial
  $('[data-toggle="tooltip"]').tooltip()
  $('.dropdown-menu').on("click.bs.dropdown", function (e) {
    e.stopPropagation();
    e.preventDefault();
  });
  if (location.hash == '') {
    $('#listTab li a[href="#overview"]').click()
  } else {
    var targetCase = decodeURI(location.hash)
    $('#listTab li a[href="' + targetCase + '"]').click()
  }
  $(window).resize(function(e){
    searchTableInitial(false)
  })
  $('body').on('click', '.external-modal', function(){
    var parameterList = {
        name: $(this).attr('modal-title'),
        type: $(this).attr('modal-type'),
        url: $(this).attr('modal-url')
      },
      modalTrigBool = true,
      html
    Object.keys(parameterList).forEach(el => {
      if(parameterList[el] === ""){
        modalTrigBool = false
      }
    })
    if (modalTrigBool) {
      switch (parameterList.type) {
        case "image":
          html = `<img class="w-100" src="${parameterList.url}">`
          break
        case "iframe":
          html = `<iframe class="w-100 h-400" src="${parameterList.url}"></iframe>`
          break
      }
      modal_open({
        title: parameterList.name,
        content: html
      })
    }
  })
  // play Setting
  var intervalControl
  $('.casePlayTrig').click(function(){
    var action = $(this).attr('action'),
        nowActiveTab = $('#listTab li.active a').attr('href')
    switch (action) {
      case 'allAutoPlay':
        viewBlockHandle('none')
        if (nowActiveTab == '#overview') {
          $('#listTab li a').eq(1).click()
        }
        intervalControl = setInterval(function(){
          if ($('#caseDetailedPageInitial').length) {
            $('#caseDetailedPageInitial').click()
          } else {
            var totalPageLength = $('#caseDetailedPageChangeTrig option').length
            if ($('#caseDetailedPageChangeTrig').val() == String(totalPageLength-1)) {
              if ($('#listTab li.active').next().find('a').length) {
                $('#listTab li.active').next().find('a').click()
              } else {
                clearInterval(intervalControl)
                $('.casePlayTrig[action="stopPlay"]').click()
              }
            } else {
              $('.caseDetailedPageControlTrig[action="next"]').click()
            }
          }
        }, Number($('#play-gap-setting').val()));
        break
      case 'oneCyclePlay':
        if (nowActiveTab != '#overview') {
          viewBlockHandle('none')
          if ($('#caseDetailedPageInitial').length) {
            $('#caseDetailedPageInitial').click()
          }
          intervalControl = setInterval(function(){
            var totalPageLength = $('#caseDetailedPageChangeTrig option').length
            if ($('#caseDetailedPageChangeTrig').val() == String(totalPageLength-1)) {
              $('.caseDetailedPageControlTrig[action="home"]').click()
            } else {
              $('.caseDetailedPageControlTrig[action="next"]').click()
            }
          }, Number($('#play-gap-setting').val()));
        } else {
          alert('請選擇任一個事件紀實，以進行單事件紀實循環播放。')
        }
        break
      case 'stopPlay':
        clearInterval(intervalControl)
        viewBlockHandle('auto')
        break
      case 'setting':
        $("#setting-info-modal").modal();
        break
    }
  })

  function viewBlockHandle(type){
    $('#projectFilterPanel').css('pointer-events', type)
    $('.casePlayTrig[action="setting"]').css('pointer-events', type)
    $('.casePlayTrig[action="allAutoPlay"]').css('pointer-events', type)
    $('.casePlayTrig[action="oneCyclePlay"]').css('pointer-events', type)
    $("#header").css('pointer-events', type)
    $("#main-content-part").css('pointer-events', type)
  }
})

function getColor(d) {
  return d > 40 ? '#800026' :
         d > 30  ? '#BD0026' :
         d > 20  ? '#E31A1C' :
         d > 15  ? '#FC4E2A' :
         d > 10   ? '#FD8D3C' :
         d > 5   ? '#FEB24C' :
                    '#FED976';
}

function searchTableInitial(first){
  if (!first) {
    $('#table-overview table').DataTable().destroy()
  }
  $('#table-overview table').DataTable({
    "order": [[ 0, "desc" ]],
    "scrollY": ($(window).height()-470) + "px",
    "scrollCollapse": true
  });
  // $('#ovarlay_list_wrapper').find(".dataTables_scrollBody").addClass("mostly-customized-scrollbar");
}

function mainPageTemplate(data){
  var input = {
      event: data.project.length,
      economic: 0,
      region: 0,
      county: {},
      agriType: 0
    },
    listTabEvent = '<li class="active pl-0"><a href="#overview">紀實總覽</a></li>'
  data.project.forEach(function(element){
    listTabEvent += `<li><a href="#${element.name}">${element.name}</a></li>`
    input.economic += element.totalEconomicLose.value / 10000
    input.region += element.mainAffectCounty.length
    element.mainAffectCounty.forEach(function(eachRegion){
      if (!input.county[eachRegion.name]) { input.county[eachRegion.name] = 0 }
      input.county[eachRegion.name] += 1
      input.agriType += eachRegion.crops.length
    })
  })
  $("#listTab ul").html(listTabEvent)
  var html = `
    <section class="counts pb-0" style="height: calc( 100vh - 115px ); padding-top: 10px;">
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
              <div class="col-lg-12 mt-3 mb-1">
                <h4 class="mb-1 font-weight-bold"><i class="icofont-table mr-2"></i>農損事件搜尋表</h4>
              </div>
              <div class="col-lg-12" id="table-overview" style="height: calc( 100vh - 330px );"></div>
            </div>
          </div>
          <div class="col-lg-3">
            <div class="w-100 rounded" id="map" style="height: calc( 100vh - 130px )"></div>
          </div>
        </div>
      </div>
    </div>`
  return {
    html: html,
    output: input,
    project: data
  }
}

function casePageTemplate(data){
  console.log(data)
  data.agriType = 0
  data.region = data.mainAffectCounty.length
  data.county = {}
  data.mainAffectCountyTableHtml = ""
  data.mainAffectCounty.forEach(function(eachRegion, index){
    data.county[eachRegion.name] = eachRegion.crops
    data.agriType += eachRegion.crops.length
    data.mainAffectCountyTableHtml += `
      <tr>
        <td>${(index+1)}</td>
        <td>${eachRegion.name}</td>
        <td>${eachRegion.crops.join('、')}</td>
      </tr>`
  })
  data.pageData = ajax_call('data/' + data.detailFile)
  var html = `
    <section class="counts pb-0" style="height: calc( 100vh - 115px ); padding-top: 10px;">
      <div class="container" data-aos="fade-up" style="max-width: unset">
        <div class="row">
          <div class="col-lg-9">
            <div class="row" style="padding-top: 20px;">
              <div class="col-lg-3 col-md-6">
                <div class="count-box external-modal" modal-type="${data.estimatedRainAccumulation.external.type}" modal-title="${data.estimatedRainAccumulation.external.name}" modal-url="${data.estimatedRainAccumulation.external.url}">
                  <i class="icofont-rainy"></i>
                  <span data-toggle="counter-up">${data.estimatedRainAccumulation.value}</span>
                  <p>事件預估雨量(mm)</p>
                </div>
              </div>
              <div class="col-lg-3 col-md-6 mt-5 mt-md-0">
                <div class="count-box external-modal" modal-type="${data.totalEconomicLose.external.type}" modal-title="${data.totalEconomicLose.external.name}" modal-url="${data.totalEconomicLose.external.url}">
                  <i class="icofont-money"></i>
                  <span data-toggle="counter-up">${(data.totalEconomicLose.value / 10000).toFixed(2)}</span>
                  <p>總經濟損失(億)</p>
                </div>
              </div>
              <div class="col-lg-3 col-md-6 mt-5 mt-lg-0">
                <div class="count-box external-modal" modal-type="" modal-title="" modal-url="">
                  <i class="icofont-google-map"></i>
                  <span data-toggle="counter-up">${data.region}</span>
                  <p>影響縣市數</p>
                </div>
              </div>
              <div class="col-lg-3 col-md-6 mt-5 mt-lg-0">
                <div class="count-box external-modal" modal-type="" modal-title="" modal-url="">
                  <i class="icofont-plant"></i>
                  <span data-toggle="counter-up">${data.agriType}</span>
                  <p>損失作物種類數</p>
                </div>
              </div>
              <div class="col-lg-12 mt-3 mb-1">
                <h4 class="mb-1 font-weight-bold"><i class="icofont-info-square mr-2"></i>${data.year + "年「" + data.name}」農損事件簡介</h4>
              </div>
              <div class="col-lg-5 overflow-auto" style="height: calc( 100vh - 390px );">
                <ul>
                  <li>事件時間：${timeConverter(data.event.start) + "~" + timeConverter(data.event.end)}</li>
                  <li>調查時間：${timeConverter(data.survey.start) + "~" + timeConverter(data.survey.end)}</li>
                  <li>調查人員：${nullConverter(data.survey.member)}</li>
                  <li>發生原因：${nullConverter(data.reason)}</li>
                  <li>事件簡述：${nullConverter(data.content)}</li>
                </ul>
              </div>
              <div class="col-lg-7 overflow-auto" style="height: calc( 100vh - 390px );">
                <ul>
                  <li>影響區域表</li>
                  <table class="table table-sm table-hover text-center table-bordered">
                    <thead class="thead-dark">
                      <tr>
                        <th>#</th>
                        <th>行政區</th>
                        <th>影響作物</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${data.mainAffectCountyTableHtml}
                    </tbody>
                  </table>
                </ul>
              </div>
              <div class="col-lg-12 text-center">
                <button type="button" id="caseDetailedPageInitial" class="btn btn-lg btn-success shadow-sm font-weight-bold mt-1">查看事件紀實(共${data.pageData.page.length}頁)<i class="icofont-simple-down ml-2"></i></button>
              </div>
            </div>
          </div>
          <div class="col-lg-3">
            <div class="w-100 rounded" id="map" style="height: calc( 100vh - 130px )"></div>
          </div>
        </div>
      </div>
    </div>`
    return {
      html: html,
      output: data
    }
}

function caseDetailedPageTemplate(data){
  var pageOption = '',
      mouseMovingStatus = false
  for (var index = 0; index < data.pageData.page.length; index++) {
    pageOption += `<option value="${index}">${index+1}</option>`
  }
  $("#main-content-part").html(`
    <section class="counts pb-0 pt-0" id="caseDetailedPage" style="height: calc( 100vh - 115px );">
      <div class="container" data-aos="fade-up" style="max-width: unset">
        <div class="row">
          <div class="col-lg-3 border-right overflow-hidden" style="height: calc( 100vh - 115px );">
            <div class="overflow-auto caseDetailedPageText" style="height: calc( 100vh - 165px );"></div>
            <div class="border-top pt-2" style="user-select: none;">
              <i class="icofont-home mr-2 c-pointer caseDetailedPageControlTrig" action="home"></i>
              <i class="icofont-ui-previous mr-2 c-pointer caseDetailedPageControlTrig" action="last"></i>
              <i class="icofont-ui-next mr-2 c-pointer caseDetailedPageControlTrig" action="next"></i>
              <div class="input-group input-group-sm mb-3" style="display: inline-flex; width: unset;">
                <div class="input-group-prepend">
                  <label class="input-group-text">第</label>
                </div>
                <select class="custom-select" id="caseDetailedPageChangeTrig" style="width: 60px;">
                  ${pageOption}
                </select>
                <div class="input-group-append">
                  <span class="input-group-text">/ ${data.pageData.page.length}頁</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-9 p-0 caseDetailedPageContent"></div>
        </div>
      </div>
    </div>`
  )
  // subPageCreate
  data.pageData.page.forEach(function(element, index){
    caseDetailedPageTemplateCreate(element, index)
  })
  // subPageCreate Initial Control
  caseDetailedPageSubControl('on', 0)
  // common Trig Event
  $('#caseDetailedPageChangeTrig').change(function(){
    caseDetailedPageSubControlInitial()
    caseDetailedPageSubControl('on', $(this).val())
  })
  $('.caseDetailedPageControlTrig').click(function(){
    
    var action = $(this).attr('action'),
        nowPageIndex = parseInt($('#caseDetailedPageChangeTrig').val())
    switch (action) {
      case 'home':
        caseDetailedPageSubControlInitial()
        caseDetailedPageSubControl('on', 0)
        $('#caseDetailedPageChangeTrig').val("0")
        break
      case 'last':
        if (nowPageIndex != 0) {
          caseDetailedPageSubControlInitial()
          caseDetailedPageSubControl('on', (nowPageIndex - 1))
          $('#caseDetailedPageChangeTrig').val(String(nowPageIndex - 1))
        } else {
          $('#listTab a[href="#' + data.name + '"]').click()
        }
        break
      case 'next':
        if (nowPageIndex != (data.pageData.page.length-1)) {
          caseDetailedPageSubControlInitial()
          caseDetailedPageSubControl('on', (nowPageIndex + 1))
          $('#caseDetailedPageChangeTrig').val(String(nowPageIndex + 1))
        }
        break
    }
    mouseMovingStatus = false
  })

  $("#main-content-part").off().mousewheel(function(e){
    if (!mouseMovingStatus && e.deltaY === -1) {
      mouseMovingStatus = true
      $('.caseDetailedPageControlTrig[action="next"]').click()
    }
    if (!mouseMovingStatus && e.deltaY === 1) {
      mouseMovingStatus = true
      $('.caseDetailedPageControlTrig[action="last"]').click()
    }
  })
}

function caseDetailedPageTemplateCreate(info, pageIndex){
  var paragraphTextHtml = '', paragraphTextHtmlStyle = '', contentHtml, mapHtml = ''
  info.supportContent.forEach(function(element){
    paragraphTextHtml += `<p>${element}</p>`
  })
  switch (info.mainContent.type) {
    case "image":
      if (info.mainContent.shape === 'scale') {
        contentHtml = `<img src="${info.mainContent.url}" class="h-100"></img>`
      } else {
        contentHtml = `<img src="${info.mainContent.url}" class="w-100 h-100"></img>`
      }
      break
    case "iframe":
      contentHtml = `<iframe src="${info.mainContent.url}" class="w-100 h-100 border-0"></iframe>`
      break
  }
  if (info.type === "map") {
    paragraphTextHtmlStyle = ' class="overflow-auto" style="height: calc( 100vh - 480px );"'
    mapHtml = `<div id="caseDetailedPageMap${pageIndex}" class="w-100" style="height: 250px;" lon="${info.coordinates[1]}" lat="${info.coordinates[0]}"></div>`
  }
  var html = {
    text: `
      <div class="d-none caseDetailedPageTextSub">
        <h4 class="border-bottom mt-3 pb-1 font-weight-bold">${info.title}</h4>
        <div${paragraphTextHtmlStyle}>
          ${paragraphTextHtml}
        </div>
        ${mapHtml}
      </div>`,
    content: `
      <div class="d-none caseDetailedPageContentSub text-center" style="height: calc( 100vh - 115px );">
        ${contentHtml}
      </div>`
  }
  $("#caseDetailedPage .caseDetailedPageText").append(html.text)
  $("#caseDetailedPage .caseDetailedPageContent").append(html.content)
}

function caseDetailedPageSubControlInitial(){
  $('.caseDetailedPageTextSub').each(function(index){
    caseDetailedPageSubControl('off', index)
  })
}

function caseDetailedPageSubControl(action, index) {
  switch (action) {
    case 'on':
      $('.caseDetailedPageTextSub').eq(index).removeClass('d-none')
      $('.caseDetailedPageContentSub').eq(index).removeClass('d-none')
      if ($('#caseDetailedPageMap' + index).length) {
        setTimeout(function(){
          var map = initialMap({
              id: 'caseDetailedPageMap' + index,
              basedMap: 'Google道路',
              legend: '<img width="12" src="https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png"> 調查點位',
              minZoom: 5,
              maxZoom: 18
            }),
            thisCoor = {lat: parseFloat($('#caseDetailedPageMap' + index).attr('lat')), lon: parseFloat($('#caseDetailedPageMap' + index).attr('lon'))}
          map.setView([thisCoor.lat, thisCoor.lon], 14)
          L.marker([thisCoor.lat, thisCoor.lon]).addTo(map).on('click', function(e){
            var url_string = "https://maps.google.com/maps?q=&layer=c&cbll=" + thisCoor.lat + "," + thisCoor.lon + "&cbp=12,270";
            window.open(url_string, '_blank');
          })
        }, 500)
      }
      break
    case 'off':
      $('.caseDetailedPageTextSub').eq(index).addClass('d-none')
      $('.caseDetailedPageContentSub').eq(index).addClass('d-none')
      break
  }
}

function initialMap(option){
  var map = L.map(option.id, {
    center: new L.LatLng(23.6962307, 121.0054591),
    zoom: 7,
    minZoom: option.minZoom,
    maxZoom: option.maxZoom,
    zoomControl: false,
    dragging: false,
    attributionControl: false
  })
  var baseMaps = {};
  baseMaps["Google道路"] = new L.tileLayer('https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i349018013!3m9!2sen-US!3sUS!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!4e0',{
      img: "https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i10!2i857!3i438!4i256!2m3!1e0!2sm!3i349018013!3m9!2sen-US!3sUS!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!4e0"
  });
  baseMaps["Google灰階街道"] = new L.tileLayer('https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i432136532!3m14!2szh-TW!3sUS!5e18!12m1!1e68!12m3!1e37!2m1!1ssmartmaps!12m4!1e26!2m2!1sstyles!2sp.s%3A-100!4e0!23i1301875',{
    maxZoom: 22,
    opacity: 1
  })
  baseMaps[option.basedMap].addTo(map);
  var legend = L.control({position: 'bottomright'});
  legend.onAdd = function (map) {
      var div = L.DomUtil.create('div', 'info legend')
      div.innerHTML = option.legend
      return div;
  };
  legend.addTo(map);
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

function timeConverter(string){
  return string.slice(0,4) + "/" + string.slice(4,6) + "/" + string.slice(6,8)
}

function nullConverter(input){
  var result = input
  if (input == '' || input == undefined || input == null) {
    result = '-'
  }
  return result
}

function dateStringToUtc(value){
  var result,
    year = parseInt(value.slice(0,4)),
    month = parseInt(value.slice(4,6))-1,
    date = parseInt(value.slice(6,9))
  result = Date.UTC(year, month, date);
  return result;
}

function modal_open(input){
  $("#atrr-info-modal .modal-title").html(input.title);
  $("#atrr-info-modal .modal-body").html(input.content);
  $("#atrr-info-modal").modal();
}