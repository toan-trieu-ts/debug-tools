const constraints = (window.constraints = {
  audio: false,
  video: {
    facingMode: "user",
    width: {
      ideal: 640,
    },
  },
});

function handleSuccess(stream) {
  const video = document.querySelector("video");
  const videoTracks = stream.getVideoTracks();
  const streamInfo = videoTracks[0].getSettings();
  video.srcObject = stream;

  console.log("Got stream with constraints:", constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  console.log(`Stream info`, streamInfo);
  video.oncanplaythrough = () => {
    video.play();
    console.log(`Video dimension width x height: ${video.videoWidth}x${video.videoHeight} px`);
  }
}

function handleError(error) {
  if (error.name === "OverconstrainedError") {
    const v = constraints.video;
    errorMsg(
      `The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`
    );
  } else if (error.name === "NotAllowedError") {
    errorMsg(
      "Permissions have not been granted to use your camera and " +
        "microphone, you need to allow the page access to your devices in " +
        "order for the demo to work."
    );
  }
  errorMsg(`getUserMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  const errorElement = document.querySelector("#errorMsg");
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== "undefined") {
    console.error(error);
  }
}

async function init(e) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
    e.target.disabled = true;
  } catch (e) {
    handleError(e);
  }
}

document.querySelector("#showVideo").addEventListener("click", (e) => init(e));
