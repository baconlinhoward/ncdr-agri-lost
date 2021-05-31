var rawData = {},
    editData = {},
    functionList = {
        'basic': {
            name: '農損調查事件清單設定',
            html: `
                <h4 class="text-muted">
                    <span class="badge badge-pill badge-info">目前設定資料清單</span>
                    <div class="btn-group float-right">
                        <button type="button" class="btn btn-primary btn-sm" id="efffective-event-add">新增調查事件資訊</button>
                        <button type="button" class="btn btn-warning btn-sm" id="download-trig">依目前設定匯出檔案</button>
                    </div>
                </h4>
                <div class="table-responsive">
                    <table id="efffective-event-table" class="table table-striped table-bordered table-sm">
                        <thead class="thead-dark">
                            <tr>
                                <th>事件名稱</th>
                                <th>災類</th>
                                <th>年度</th>
                                <th>時間(起)</th>
                                <th>時間(迄)</th>
                                <th>經濟損失</th>
                                <th>管理操作</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>`,
            execute: function(){
                var html = {
                    tbody: []
                }
                renewData()
                var thisDatatable = $("#efffective-event-table").DataTable({
                    data: html.tbody
                })
                $("#efffective-event-table").on("click", ".efffective-event", function(){
                    var action = $(this).attr("action-type"), targetIndex = Number($(this).attr("target-id"))
                    switch (action) {
                        case "update":
                            editModal(editData.basic[targetIndex], targetIndex)
                            break;
                        case "delete":
                            editData.basic.splice(targetIndex, 1)
                            renewData("update")
                            break;
                    }
                })
                $("#efffective-event-add").click(function(){
                    editModal()
                })
                $("#download-trig").click(function(){
                    downloadObjectAsJson(editData.basic, 'basic')
                })

                function renewData(type){
                    html.tbody = []
                    editData.basic.forEach(function(el, index){
                        html.tbody.push([
                            el.name,
                            el.reason,
                            el.year,
                            time_string_processing(el.event.start),
                            time_string_processing(el.event.end),
                            el.totalEconomicLose.value + "萬",
                            `<div class="btn-group">
                                <button type="button" target-id="${index}" class="btn btn-success btn-sm efffective-event" action-type="update">修改</button>
                                <button type="button" target-id="${index}" class="btn btn-danger btn-sm efffective-event" action-type="delete">刪除</button>
                            </div>`
                        ]) 
                    })
                    if (type === "update") {
                        thisDatatable.clear();
                        thisDatatable.rows.add(html.tbody);
                        thisDatatable.draw();
                    }
                }

                function createObjectTemplateWithValue(){
                    var result = {
                        "event": {
                            "start": $('input.survey-info[target="event-start"]').val(),
                            "end": $('input.survey-info[target="event-end"]').val()
                        },
                        "survey": {
                            "member": $('input.survey-info[target="survey-member"]').val(),
                            "start": $('input.survey-info[target="survey-start"]').val(),
                            "end": $('input.survey-info[target="survey-end"]').val()
                        },
                        "year": Number($('input.survey-info[target="year"]').val()),
                        "name": $('input.survey-info[target="name"]').val(),
                        "reason": $('select.survey-info[target="reason"]').val(),
                        "content": $('input.survey-info[target="content"]').val(),
                        "estimatedRainAccumulation": {
                            "value": Number($('input.survey-info[target="estimatedRainAccumulation-value"]').val()),
                            "external": {
                                "name": $('input.survey-info[target="estimatedRainAccumulation-external-name"]').val(),
                                "type": $('select.survey-info[target="estimatedRainAccumulation-external-type"]').val(),
                                "url": $('input.survey-info[target="estimatedRainAccumulation-external-url"]').val()
                            }
                        },
                        "mainAffectCounty": [{
                            "name": "屏東縣",
                            "crops": ["芒果", "蓮霧", "荔枝"]
                        }, {
                            "name": "高雄市",
                            "crops": ["水稻", "木瓜"]
                        }, {
                            "name": "雲林縣",
                            "crops": ["食用玉米", "落花生"]
                        }],
                        "totalEconomicLose": {
                            "value": Number($('input.survey-info[target="totalEconomicLose-value"]').val()),
                            "external": {
                                "name": $('input.survey-info[target="totalEconomicLose-external-name"]').val(),
                                "type": $('select.survey-info[target="totalEconomicLose-external-type"]').val(),
                                "url": $('input.survey-info[target="totalEconomicLose-external-url"]').val()
                            }
                        },
                        "detailFile": $('input.survey-info[target="detailFile"]').val()
                    }
                    return result
                }

                function editModal(input, targetIndex){
                    var modalTitle = "農損調查事件新增"
                    if (input) {
                        modalTitle = "農損調查事件修改(" + input.name + ")"
                    } 
                    modal_open(`
                        <div class="form-group">
                            <label class="mb-1">事件名稱</label>
                            <input class="form-control form-control-sm survey-info" target="name">
                        </div>
                        <div class="form-group">
                            <label class="mb-1">災害類型</label>
                            <select class="form-control form-control-sm survey-info" target="reason">
                                <option value="水災">水災</option>
                                <option value="乾旱">乾旱</option>
                                <option value="寒害">寒害</option>
                                <option value="火災">火災</option>
                                <option value="蟲害">蟲害</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="mb-1">所屬年度(西元)</label>
                            <input class="form-control form-control-sm survey-info" target="year">
                        </div>
                        <div class="form-group">
                            <label class="mb-1">事件發生</label>
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">開始</span>
                                </div>
                                <input type="text" class="form-control survey-info" target="event-start">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">結束</span>
                                </div>
                                <input type="text" class="form-control survey-info" target="event-end">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="mb-1">事件簡述文字</label>
                            <textarea class="form-control form-control-sm survey-info" rows="5" target="content"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="mb-1">事件雨量(釐米)</label>
                            <input class="form-control form-control-sm survey-info" target="estimatedRainAccumulation-value">
                        </div>
                        <div class="form-group">
                            <label class="mb-1">事件雨量額外資訊設定</label>
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">名稱</span>
                                </div>
                                <input type="text" class="form-control survey-info" target="estimatedRainAccumulation-external-name">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">類型</span>
                                </div>
                                <select class="form-control form-control-sm survey-info" target="estimatedRainAccumulation-external-type">
                                    <option value="image">照片</option>
                                    <option value="iframe">iframe</option>
                                </select>
                                <div class="input-group-prepend">
                                    <span class="input-group-text">路徑</span>
                                </div>
                                <input type="text" class="form-control survey-info" target="estimatedRainAccumulation-external-url">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="mb-1">經濟損失(萬)</label>
                            <input class="form-control form-control-sm survey-info" target="totalEconomicLose-value">
                        </div>
                        <div class="form-group">
                            <label class="mb-1">經濟損失額外資訊設定</label>
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">名稱</span>
                                </div>
                                <input type="text" class="form-control survey-info" target="totalEconomicLose-external-name">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">類型</span>
                                </div>
                                <select class="form-control form-control-sm survey-info" target="totalEconomicLose-external-type">
                                    <option value="image">照片</option>
                                    <option value="iframe">iframe</option>
                                </select>
                                <div class="input-group-prepend">
                                    <span class="input-group-text">路徑</span>
                                </div>
                                <input type="text" class="form-control survey-info" target="totalEconomicLose-external-url">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="mb-1">調查人員團隊名稱</label>
                            <input class="form-control form-control-sm survey-info" target="survey-member">
                        </div>
                        <div class="form-group">
                            <label class="mb-1">調查時間</label>
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">開始</span>
                                </div>
                                <input type="text" class="form-control survey-info" target="survey-start">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">結束</span>
                                </div>
                                <input type="text" class="form-control survey-info" target="survey-end">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="mb-1">調查事件.json檔案路徑設定(依給定的事件名稱而定)</label>
                            <input class="form-control form-control-sm survey-info" disabled target="detailFile">
                        </div>`,
                        '<button type="button" class="btn btn-success btn-sm float-right" id="survey-form-sumbit">提交設定</button>',
                        modalTitle,
                        function(){
                            $('input.survey-info[target="name"]').keyup(function(){
                                var value = $(this).val(), 
                                    filePath = value + "/" + value + ".json"
                                if (value !== "") {
                                    $('input.survey-info[target="detailFile"]').val(filePath)
                                } else {
                                    $('input.survey-info[target="detailFile"]').val("")
                                }
                            })
                            if (input) {
                                // 依目前state更新至表單值
                                $('input.survey-info[target="event-start"]').val(input.event.start)
                                $('input.survey-info[target="event-end"]').val(input.event.end)
                                $('input.survey-info[target="survey-member"]').val(input.survey.member)
                                $('input.survey-info[target="survey-start"]').val(input.survey.start)
                                $('input.survey-info[target="survey-end"]').val(input.survey.end)
                                $('input.survey-info[target="year"]').val(input.year)
                                $('input.survey-info[target="name"]').val(input.name)
                                $('select.survey-info[target="reason"]').val(input.reason)
                                $('input.survey-info[target="content"]').val(input.content)
                                $('input.survey-info[target="estimatedRainAccumulation-value"]').val(input.estimatedRainAccumulation.value)
                                $('input.survey-info[target="estimatedRainAccumulation-external-name"]').val(input.estimatedRainAccumulation.external.name)
                                $('select.survey-info[target="estimatedRainAccumulation-external-type"]').val(input.estimatedRainAccumulation.external.type)
                                $('input.survey-info[target="estimatedRainAccumulation-external-url"]').val(input.estimatedRainAccumulation.external.url)
                                $('input.survey-info[target="totalEconomicLose-value"]').val(input.totalEconomicLose.value)
                                $('input.survey-info[target="totalEconomicLose-external-name"]').val(input.totalEconomicLose.external.name)
                                $('select.survey-info[target="totalEconomicLose-external-type"]').val(input.totalEconomicLose.external.type)
                                $('input.survey-info[target="totalEconomicLose-external-url"]').val(input.totalEconomicLose.external.url)
                                $('input.survey-info[target="detailFile"]').val(input.detailFile)
                                // 表單提交 - 更新狀況
                                $("#survey-form-sumbit").click(function(){
                                    var updateObject = createObjectTemplateWithValue()
                                    editData.basic[targetIndex] = updateObject
                                    renewData("update")
                                    $("#event_modal").modal('hide')
                                })
                            } else {
                                // 表單提交 - 新增狀況
                                $("#survey-form-sumbit").click(function(){
                                    var insertObject = createObjectTemplateWithValue()
                                    editData.basic.push(insertObject)
                                    renewData("update")
                                    $("#event_modal").modal('hide')
                                })
                            }
                        }
                    )
                }
            }
        },
        'detailed': {
            name: '單一調查事件內容設定',
            html: `
                <h4 class="text-muted">
                    <span class="badge badge-pill badge-info">目前設定資料清單</span>
                </h4>
                <div class="table-responsive">
                    <table id="efffective-event-table" class="table table-striped table-bordered table-sm">
                        <thead class="thead-dark">
                            <tr>
                                <th>事件名稱</th>
                                <th>災類</th>
                                <th>年度</th>
                                <th>時間(起)</th>
                                <th>時間(迄)</th>
                                <th>經濟損失</th>
                                <th>管理操作</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>`,
            execute: function(){
                var html = {
                    tbody: []
                }
                renewData()
                var thisDatatable = $("#efffective-event-table").DataTable({
                    data: html.tbody
                })
                // 設定檔按鈕綁定
                $("#efffective-event-table").on("click", ".setting-event", function(){
                    var targetIndex = Number($(this).attr("target-id")),
                        thisEventInfo = editData.basic[targetIndex],
                        thisServerSettingJson = ajax_call("data/" + thisEventInfo.detailFile)
                    console.log(thisEventInfo)
                    console.log(thisServerSettingJson)
                    if (thisServerSettingJson) {
                        if (thisEventInfo.page) {
                            editModal(thisEventInfo, targetIndex, thisEventInfo.page)
                        } else {
                            editModal(thisEventInfo, targetIndex, thisServerSettingJson.page)
                        }
                    } else {
                        editModal(thisEventInfo, targetIndex)
                    }
                })

                function renewData(){
                    html.tbody = []
                    editData.basic.forEach(function(el, index){
                        html.tbody.push([
                            el.name,
                            el.reason,
                            el.year,
                            time_string_processing(el.event.start),
                            time_string_processing(el.event.end),
                            el.totalEconomicLose.value + "萬",
                            `<div class="btn-group">
                                <button type="button" target-id="${index}" class="btn btn-success btn-sm setting-event">頁面設定</button>
                            </div>`
                        ]) 
                    })
                }

                function editModal(thisEventInfo, targetIndex, beforeParameter){
                    var modalTitle = "農損調查事件頁面新增(" + thisEventInfo.name + ")"
                    if (beforeParameter) {
                        modalTitle = "農損調查事件頁面修改(" + thisEventInfo.name + ")"
                    } 
                    modal_open(`
                        <button type="button" class="btn btn-primary btn-sm">新增頁面</button>
                        <table id="survey-page-setting-table" class="table table-striped table-bordered table-sm text-center">
                            <thead class="thead-dark">
                                <tr>
                                    <th>頁數</th>
                                    <th>標題</th>
                                    <th>類型</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>`,
                        '<button type="button" class="btn btn-success btn-sm float-right" id="survey-form-sumbit">提交設定並匯出設定檔</button>',
                        modalTitle,
                        function(){
                            var dataArray = []
                            if (beforeParameter) {
                                dataArray = beforeParameter
                            }
                            renewSurveyPageTable(dataArray)

                            function renewSurveyPageTable(array){
                                var html = ''
                                if (array.length === 0) {
                                    html = '<tr> <td colspan="4">目前尚未有內容</td> </tr>'
                                } else {
                                    array.forEach(function(element, index){
                                        html += `
                                            <tr>
                                                <td>第${(index+1)}頁</td>
                                                <td>${element.title}</td>
                                                <td>${element.type}</td>
                                                <td>
                                                    <div class="btn-group">
                                                        <button type="button" class="btn btn-success btn-sm">設定</button>
                                                        <button type="button" class="btn btn-danger btn-sm">刪除</button>
                                                    </div>
                                                </td>
                                            </tr>`
                                    })
                                }
                                $("#survey-page-setting-table tbody").html(html)
                            }
                        }
                    )
                }
            }
        }
}

$(document).ready(function() {
    var render = { nav: '' }
    // data
    rawData.basic = ajax_call('data/basic.json')
    editData.basic = ajax_call('data/basic.json')
    console.log(rawData)
    console.log(editData)
    // initial
    Object.keys(functionList).forEach(function(el){
        render.nav += 
            `<li class="nav-item">
                <a class="nav-link" href="#${el}" function-name="${el}">
                    ${functionList[el].name}
                </a>
            </li>`
    })
    $('#setting-nav').html(render.nav)
    // events
    $('#setting-nav').on('click', 'a.nav-link', function(){
        $('#setting-nav a.nav-link').each(function(){
            $(this).removeClass('active')
        })
        var target = $(this).attr('function-name')
        $(this).addClass('active')
        $('#setting-title').html(functionList[target].name)
        $('#main-content').html(functionList[target].html)
        functionList[target].execute()
    })
    if(Object.keys(functionList).includes(location.hash.replace('#', ''))){
        $('#setting-nav a.nav-link[function-name="' + location.hash.replace('#', '') + '"]').click()
    } else {
        $('#setting-nav a.nav-link').eq(0).click()
    }
})

function ajax_call(url){
    var result = null;
    var scriptUrl = url;
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

function modal_open(html_string, footer_string, title_string, callBack){
	if(title_string){ 
		$("#event_modal .modal-title").html(title_string) 
	} else {
		$("#event_modal .modal-title").html("Dialog Viewer") 
	}
    $("#event_modal .modal-footer").html(footer_string);
	$('#event_modal').modal({
        backdrop:'static',
        keyboard:false, 
        show:true
    });
	$("#event_container").empty();
	setTimeout(function(){
		$("#event_container").html(html_string);
		if (callBack) {
			callBack()
		}
	}, 1000);
}

function timeStringConvert(string){
    return string.slice(0, 4) + "-" + string.slice(4, 6) + "-" + string.slice(6, 8) + " " + string.slice(8, 10) + ":" + string.slice(10, 12)
}
  
function time_string_processing(input){
    var result = input.slice(0,4) + "/" + input.slice(4,6) + "/" + input.slice(6,8);
    return result;
}

function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}