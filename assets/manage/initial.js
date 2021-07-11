var taiwanLayer = ajax_call("data/taiwan.json"),
    rawData = {},
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
                <div class="table-responsive" style="overflow-x: unset;">
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
                    tbody: [],
                    taiwainOption: ""
                }
                taiwanLayer.features.forEach(function(feature){
                    html.taiwainOption += `<option value="${feature.properties.COUNTYNAME}">${feature.properties.COUNTYNAME}</option>`
                })
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
                            "start": $('input.survey-info[target="event-start"]').val().replaceAll("-", ""),
                            "end": $('input.survey-info[target="event-end"]').val().replaceAll("-", "")
                        },
                        "survey": {
                            "member": $('input.survey-info[target="survey-member"]').val(),
                            "start": $('input.survey-info[target="survey-start"]').val().replaceAll("-", ""),
                            "end": $('input.survey-info[target="survey-end"]').val().replaceAll("-", "")
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
                        "mainAffectCounty": [],
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
                    $("tr.survey-info-adding-row").each(function(){
                        result["mainAffectCounty"].push({
                            "name": $(this).find("td").eq(0).text(),
                            "crops": $(this).find("td").eq(1).text().split(",")
                        })
                    })
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
                        <div class="form-group mb-0">
                            <label class="mb-1">影響縣市與作物</label>
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">縣市</span>
                                </div>
                                <select class="form-control form-control-sm survey-info-adding-affected-input" target="region">
                                    ${html.taiwainOption}
                                </select>
                                <div class="input-group-prepend">
                                    <span class="input-group-text">作物</span>
                                </div>
                                <input type="text" class="form-control survey-info-adding-affected-input" target="crop" placeholder="多作物時，請用「,」隔開">
                                <button type="button" class="btn btn-primary btn-sm rounded-0" id="survey-info-adding-affected-trig">新增</button>
                            </div>
                        </div>
                        <table id="survey-info-adding-affected-table" class="table table-sm table-bordered text-center">
                            <thead class="thead-dark">
                                <tr>
                                    <th>縣市名稱</th>
                                    <th>作物清單</th>
                                    <th>刪除</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr id="survey-info-adding-affected-unset">
                                    <td colspan="3">目前無設定影響縣市與作物</td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="form-group">
                            <label class="mb-1">事件發生</label>
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">開始</span>
                                </div>
                                <input type="text" class="form-control survey-info date-picker" target="event-start">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">結束</span>
                                </div>
                                <input type="text" class="form-control survey-info date-picker" target="event-end">
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
                                <input type="text" class="form-control survey-info date-picker" target="survey-start">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">結束</span>
                                </div>
                                <input type="text" class="form-control survey-info date-picker" target="survey-end">
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
                                    filePath = "data/" + value + "/" + value + ".json"
                                if (value !== "") {
                                    $('input.survey-info[target="detailFile"]').val(filePath)
                                } else {
                                    $('input.survey-info[target="detailFile"]').val("")
                                }
                            })
                            $("#survey-info-adding-affected-table tbody").on("click", "button.survey-info-adding-affected-delete", function(){
                                $(this).parents("tr").eq(0).remove()
                                if ($("tr.survey-info-adding-row").length === 0) {
                                    $("#survey-info-adding-affected-table tbody").html('<tr id="survey-info-adding-affected-unset"> <td colspan="3">目前無設定影響縣市與作物</td> </tr>')
                                }
                            })
                            $('#survey-info-adding-affected-trig').click(function(){
                                var param = {}, 
                                    valueCheck = true,
                                    currentSetting = $("#survey-info-adding-affected-unset").length //判斷目前有否影響作物的設定
                                $(".survey-info-adding-affected-input").each(function(){
                                    param[$(this).attr("target")] = $(this).val()
                                    if ($(this).val() === "") {
                                        valueCheck = false
                                    }
                                })
                                if (valueCheck) {
                                    if (currentSetting) {
                                        $("#survey-info-adding-affected-unset").remove()
                                    }
                                    $("#survey-info-adding-affected-table tbody").append(`
                                        <tr class="survey-info-adding-row">
                                            <td>${param.region}</td>
                                            <td>${param.crop}</td>
                                            <td><button type="button" class="btn btn-sm btn-danger survey-info-adding-affected-delete">刪除</button></td>
                                        </tr>`
                                    )
                                } else {
                                    alert("作物欄位不得為空")
                                }
                            })
                            if (input) {
                                // 依目前state更新至表單值
                                if (input.mainAffectCounty.length !== 0) {
                                    var html = ""
                                    input.mainAffectCounty.forEach(element => {
                                        html += `
                                            <tr class="survey-info-adding-row">
                                                <td>${element.name}</td>
                                                <td>${element.crops.join()}</td>
                                                <td><button type="button" class="btn btn-sm btn-danger survey-info-adding-affected-delete">刪除</button></td>
                                            </tr>`
                                    })
                                    $("#survey-info-adding-affected-table tbody").html(html)
                                }
                                $('input.survey-info[target="event-start"]').val(input.event.start.slice(0,4) + "-" + input.event.start.slice(4,6) + "-" + input.event.start.slice(6,8))
                                $('input.survey-info[target="event-end"]').val(input.event.end.slice(0,4) + "-" + input.event.end.slice(4,6) + "-" + input.event.end.slice(6,8))
                                $('input.survey-info[target="survey-member"]').val(input.survey.member)
                                $('input.survey-info[target="survey-start"]').val(input.survey.start.slice(0,4) + "-" + input.survey.start.slice(4,6) + "-" + input.survey.start.slice(6,8))
                                $('input.survey-info[target="survey-end"]').val(input.survey.end.slice(0,4) + "-" + input.survey.end.slice(4,6) + "-" + input.survey.end.slice(6,8))
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
                                $('.date-picker').datepicker({
                                    format: 'yyyy-mm-dd',
                                    orientation: 'top'
                                })
                                // 表單提交 - 更新狀況
                                $("#survey-form-sumbit").click(function(){
                                    var updateObject = createObjectTemplateWithValue()
                                    editData.basic[targetIndex] = updateObject
                                    renewData("update")
                                    $("#event_modal").modal('hide')
                                })
                            } else {
                                $('.date-picker').datepicker({
                                    format: 'yyyy-mm-dd',
                                    orientation: 'top'
                                })
                                // 表單提交 - 新增狀況
                                $("#survey-form-sumbit").click(function(){
                                    var insertObject = createObjectTemplateWithValue()
                                    if (insertObject.name === "") {
                                        alert("事件名稱尚未填寫！")
                                    } else {
                                        editData.basic.push(insertObject)
                                        renewData("update")
                                        $("#event_modal").modal('hide')
                                    }
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
                <div class="table-responsive" style="overflow-x: unset;">
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
                        thisServerSettingJson = ajax_call(thisEventInfo.detailFile)
                    if (thisServerSettingJson) {
                        if (thisEventInfo.page) {
                            editModal(thisEventInfo, targetIndex, thisEventInfo.page)
                        } else {
                            thisEventInfo.page = thisServerSettingJson.page
                            editModal(thisEventInfo, targetIndex, thisServerSettingJson.page)
                        }
                    } else {
                        if (thisEventInfo.page) {
                            editModal(thisEventInfo, targetIndex, thisEventInfo.page)
                        } else {
                            thisEventInfo.page = []
                            editModal(thisEventInfo, targetIndex)
                        }
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
                    var modalTitle = "農損調查事件頁面設定(" + thisEventInfo.name + ")",
                        contentPageTypeMapping = {
                            normal: "一般",
                            map: "地圖"
                        }
                    modal_open(`
                        <h6 class="font-weight-bold">頁面新增設定</h6>
                        <div class="form-group">
                            <label class="m-0">頁面標題</label>
                            <input class="form-control survey-page-adding" target="title">
                        </div>
                        <div class="form-group">
                            <label class="m-0">頁面類型</label>
                            <select class="form-control survey-page-adding" target="type">
                                <option value="normal">一般</option>
                                <option value="map">地圖</option>
                            </select>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" id="survey-page-adding-trig">新增頁面</button>
                        <hr>
                        <h6 class="font-weight-bold">頁面內容設定</h6>
                        <table id="survey-page-setting-table" class="table table-striped table-bordered table-sm text-center mb-0">
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
                        '<button type="button" class="btn btn-success btn-sm float-right" id="survey-form-sumbit">匯出本事件頁面設定檔</button>',
                        modalTitle,
                        function(){
                            var dataArray = []
                            if (beforeParameter) {
                                dataArray = beforeParameter
                            }
                            renewSurveyPageTable(dataArray)

                            $("#survey-page-adding-trig").click(function(){
                                var param = {}, boolean = true
                                $(".survey-page-adding").each(function(){
                                    var thisValue = $(this).val(),
                                        thisAttr = $(this).attr("target")
                                    param[thisAttr] = thisValue
                                    if (thisValue === "") {
                                        boolean = false
                                    }
                                })
                                if (boolean) {
                                    thisEventInfo.page.push({
                                        mainContent:  {
                                            type: "image",
                                            url: ""
                                        },
                                        supportContent: [],
                                        title: param["title"],
                                        type: param["type"]
                                    })
                                    renewSurveyPageTable(thisEventInfo.page)
                                    alert("頁面新增成功，請再於下方列表設定本頁內容！")
                                } else {
                                    alert("頁面標題尚未輸入！")
                                }
                            })

                            $("#survey-form-sumbit").click(function(){
                                var donwloadObject = { page: thisEventInfo.page }
                                downloadObjectAsJson(donwloadObject, thisEventInfo.name)
                            })

                            $("#survey-page-setting-table tbody").on("click", ".survey-page-updating", function(){
                                var param = {
                                        action: $(this).attr("target"),
                                        pageIndex: Number($(this).parents('tr').attr("original-index"))
                                    },
                                    thisRowDom = $(this)
                                switch (param["action"]) {
                                    case "update":
                                        var thisPageInfo = thisEventInfo.page[param["pageIndex"]]
                                        if ($("#survey-page-updating-row").length !== 0) {
                                            $("#survey-page-updating-row").remove()
                                        }
                                        thisRowDom.parents("tr").after(`
                                            <tr class="bg-dark text-white" id="survey-page-updating-row">
                                                <td class="text-left" colspan="4">
                                                    <div class="form-group">
                                                        <label class="m-0">頁面標題</label>
                                                        <input class="form-control" target="title">
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="m-0">頁面類型</label>
                                                        <select class="form-control" target="type">
                                                            <option value="normal">一般</option>
                                                            <option value="map">地圖</option>
                                                        </select>
                                                    </div>
                                                    <div class="mb-3 coor-input">
                                                        <label class="m-0">地圖經緯度設定</label>
                                                        <div class="input-group">
                                                            <div class="input-group-prepend">
                                                                <span class="input-group-text">經度</span>
                                                            </div>
                                                            <input type="text" class="form-control" target="lon">
                                                            <div class="input-group-append">
                                                                <span class="input-group-text">緯度</span>
                                                            </div>
                                                            <input type="text" class="form-control" target="lat">
                                                        </div>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="m-0">內容類型</label>
                                                        <select class="form-control" target="mainContent-type">
                                                            <option value="image">圖片</option>
                                                            <option value="iframe">iframe</option>
                                                        </select>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="m-0">內容路徑</label>
                                                        <input class="form-control" target="mainContent-url">
                                                    </div>
                                                   <div class="form-group">
                                                        <label class="m-0">內容顯示比例</label>
                                                        <select class="form-control" target="mainContent-shape">
                                                            <option value="full">填滿</option>
                                                            <option value="scale">依來源比例</option>
                                                        </select>
                                                    </div>
                                                    <div class="form-group mb-2">
                                                        <label class="m-0">說明文字</label>
                                                        <textarea class="form-control" rows="6" target="supportContent"></textarea>
                                                    </div>
                                                    <div class="btn-group mb-2">
                                                        <button type="button" class="btn btn-success btn-sm" target="update">更新</button>
                                                        <button type="button" class="btn btn-danger btn-sm" target="close">關閉</button>
                                                    </div>
                                                </td>
                                            </tr>`
                                        )
                                        // 
                                        if (thisPageInfo.mainContent.shape == undefined) {
                                            thisPageInfo.mainContent.shape = "full"
                                        }
                                        if (thisPageInfo.coordinates != undefined) {
                                            $('#survey-page-updating-row .coor-input input[target="lon"]').val(thisPageInfo.coordinates[1])
                                            $('#survey-page-updating-row .coor-input input[target="lat"]').val(thisPageInfo.coordinates[0])
                                        }
                                        $('#survey-page-updating-row input[target="title"]').val(thisPageInfo.title)
                                        $('#survey-page-updating-row select[target="type"]').val(thisPageInfo.type)
                                        $('#survey-page-updating-row select[target="mainContent-type"]').val(thisPageInfo.mainContent.type)
                                        $('#survey-page-updating-row input[target="mainContent-url"]').val(thisPageInfo.mainContent.url)
                                        $('#survey-page-updating-row select[target="mainContent-shape"]').val(thisPageInfo.mainContent.shape)
                                        $("#survey-page-updating-row textarea").val(thisPageInfo.supportContent[0])
                                        // 
                                        $("#survey-page-updating-row .btn").click(function(){
                                            switch ($(this).attr("target")) {
                                                case "update":
                                                    thisPageInfo.title = $('#survey-page-updating-row input[target="title"]').val()
                                                    thisPageInfo.type = $('#survey-page-updating-row select[target="type"]').val()
                                                    thisPageInfo.mainContent.type = $('#survey-page-updating-row select[target="mainContent-type"]').val()
                                                    thisPageInfo.mainContent.url = $('#survey-page-updating-row input[target="mainContent-url"]').val()
                                                    thisPageInfo.mainContent.shape = $('#survey-page-updating-row select[target="mainContent-shape"]').val()
                                                    thisPageInfo.supportContent[0] = $("#survey-page-updating-row textarea").val()
                                                    thisPageInfo.coordinates = [$('#survey-page-updating-row .coor-input input[target="lat"]').val(), $('#survey-page-updating-row .coor-input input[target="lon"]').val()]
                                                    renewSurveyPageTable(thisEventInfo.page)
                                                    break;
                                                case "close":
                                                    $("#survey-page-updating-row").remove()
                                                    break;
                                            }
                                        })
                                        $('#survey-page-updating-row select[target="type"]').change(function(){
                                            var targetType = $(this).val()
                                            if (targetType === "normal") {
                                                $("#survey-page-updating-row .coor-input").addClass("d-none")
                                            } else {
                                                $("#survey-page-updating-row .coor-input").removeClass("d-none")
                                            }
                                        }).trigger("change")
                                        break;
                                    case "delete":
                                        thisEventInfo.page.splice(param["pageIndex"],1)
                                        renewSurveyPageTable(thisEventInfo.page)
                                        break;
                                }
                            })

                            function renewSurveyPageTable(array){
                                var html = ''
                                if (array.length === 0) {
                                    html = '<tr> <td colspan="4">目前尚未有頁面內容</td> </tr>'
                                } else {
                                    array.forEach(function(element, index){
                                        html += `
                                            <tr original-index="${index}" style="cursor: grab;">
                                                <td>↑↓第${(index+1)}頁</td>
                                                <td>${element.title}</td>
                                                <td>${contentPageTypeMapping[element.type]}</td>
                                                <td>
                                                    <div class="btn-group">
                                                        <button type="button" class="btn btn-success btn-sm survey-page-updating" target="update" target-index="${index}">設定</button>
                                                        <button type="button" class="btn btn-danger btn-sm survey-page-updating" target="delete" target-index="${index}">刪除</button>
                                                    </div>
                                                </td>
                                            </tr>`
                                    })
                                }
                                $("#survey-page-setting-table tbody").html(html)
                                $("#survey-page-setting-table tbody").sortable({
                                    update: function(){
                                        $("#survey-page-updating-row").remove()
                                        var newDataArray = []
                                        $("#survey-page-setting-table tbody tr").each(function(index){
                                            $(this).find("td").eq(0).html("↑↓第" + (index+1) + "頁")
                                            var thisOriginalIndex = Number($(this).attr("original-index")),
                                                thisRowInfo = dataArray[thisOriginalIndex]
                                            if (thisRowInfo) {
                                                newDataArray.push(thisRowInfo)
                                            }
                                            $(this).attr("original-index", String(index))
                                        })
                                        dataArray = newDataArray
                                        thisEventInfo.page = newDataArray
                                    }
                                })
                            }
                        }
                    )
                }
            }
        }
}

$(document).ready(function() {
    var render = { nav: '' }, randomh = Date.now();
    // data
    rawData.basic = ajax_call('data/basic.json?t=' + randomh)
    editData.basic = ajax_call('data/basic.json?t=' + randomh)
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
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}