var NXAPIPacks = require('./api-connector/api-connector.js');
var image2json = require('./nx/image2json.js');
var NXIMage = image2json.NXImage;
var fs = require('fs');


const najax = require('najax');


//Google

var googleImageAnalysisAPIPack = function(apiInfo, packType) {

  var entitypack = new NXAPIPacks.NXAPIPack(apiInfo, packType);

  entitypack.setAPIFunctionInitialize(function(serverPack, req, res, baseAPIResponse) {

    var image = req.body.image;

    if (image != undefined && image.dataURI != undefined) {

      baseAPIResponse.inputDataPresent = "true";
    //   baseAPIResponse.image = image;

      var gcloud_pid = process.env.GCLOUD_PROJECT;
      var privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n');
      var clientEmail = process.env.GOOGLE_CLOUD_EMAIL;

      serverPack.gcloudConfig = {
        projectId: gcloud_pid,
        credentials: {
          client_email: clientEmail,
          private_key: privateKey
        }
      };

      serverPack.gcloud = require('google-cloud')(serverPack.gcloudConfig);

      var vision = serverPack.gcloud.vision();

      serverPack.gcloudParameters = {
        // language: language,
        image: image
        // config: config
      };

      serverPack.visionClient = vision;

      serverPack.setReady(true);
    } else {
      baseAPIResponse.error = "Error processing input data.";
    }

  });

  entitypack.setAPIFunctionExecute(function(serverPack, apiResponse, completion) {


    // var config = serverPack.gcloudParameters.config;

    var types = ['labels', 'landmarks', 'logos', 'properties', 'safeSearch', 'text', 'faces'];
    var optionsDict = new Object();
    optionsDict.types = types;
    optionsDict.verbose = true;

    var buffer = NXIMage.bufferFromJsonImage(serverPack.gcloudParameters.image);

    serverPack.visionClient.detect(buffer, optionsDict, function(err, detections) {
      var renderText = "";

      if (err) {
        console.log("Image processing error."+err);
        renderText += "<h1>Cloud Vision Error</h1>";
        console.log('error:', err);
        // apiResponse.result.score = -1;
        resultObject = err;
      }
      else {
          apiResponse.result.score = (detections.labels == undefined) ? 0 : detections.labels.length;
        resultObject = detections;
      }

      apiResponse.serverResponse = resultObject;


      completion(apiResponse);

    });


  });

  return entitypack;
};

exports.googleImageAnalysisAPIPack = googleImageAnalysisAPIPack;