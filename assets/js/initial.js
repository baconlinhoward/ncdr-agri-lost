$(document).ready(function(){
  var data = ajax_call("data/basic.json"),
      initialMainPageHtml = mainPageTemplate("test")
  console.log(data)
  $("#main-content-part").html(initialMainPageHtml)
})

function mainPageTemplate(input){
  var html = `
    <section class="counts" style="height: calc( 100vh - 125px );">
      <div class="container" data-aos="fade-up">
        <div class="row">
          <div class="col-lg-3 col-md-6">
            <div class="count-box">
              <i class="icofont-simple-smile"></i>
              <span data-toggle="counter-up">232</span>
              <p>Happy Clients</p>
            </div>
          </div>
          <div class="col-lg-3 col-md-6 mt-5 mt-md-0">
            <div class="count-box">
              <i class="icofont-document-folder"></i>
              <span data-toggle="counter-up">521</span>
              <p>Projects</p>
            </div>
          </div>
          <div class="col-lg-3 col-md-6 mt-5 mt-lg-0">
            <div class="count-box">
              <i class="icofont-live-support"></i>
              <span data-toggle="counter-up">1,463</span>
              <p>Hours Of Support</p>
            </div>
          </div>
          <div class="col-lg-3 col-md-6 mt-5 mt-lg-0">
            <div class="count-box">
              <i class="icofont-users-alt-5"></i>
              <span data-toggle="counter-up">15</span>
              <p>Hard Workers</p>
            </div>
          </div>
        </div>
      </div>
    </div>`
  return html
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