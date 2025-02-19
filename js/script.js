let currentSong = new Audio();
let songs;
let cfolder;

// for hamburger button for smaller screens
document.querySelector(".hamburger").addEventListener("click", () => {
  document.querySelector(".left").style.left="0";
})

document.querySelector(".close").addEventListener("click", () => {
  document.querySelector(".left").style.left="-100%";
})



function secondToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formatMinute = String(minutes).padStart(2, "0");
  const formatSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formatMinute}:${formatSeconds}`;
}

async function getSongs(folder) {
  cfolder = folder;
  let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
  let response = await a.text();
  // console.log(response);
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  songs = [];

  for (let index = 0; index < as.length; index++) {
    const element = as[index];

    if (element.href.endsWith(".mp3")) {
      songs.push(element.href.split(`/${folder}/`)[1]);
    }
  }

  // Get the songlist container and clear it entirely before appending new songs
  let songlist = document.querySelector(".songlist");
  songlist.innerHTML = '';  // Clear the entire song list before adding new songs
  
  let songul = document.createElement("ul");
  songlist.appendChild(songul);

  for (const song of songs) {
    let li = document.createElement("li");
    li.innerHTML = `
        <img class="song" src="song.svg" alt="">
        <span class="info">${song.replaceAll("%20", " ")}</span>
        <img class="play-button invert-img" src="play.svg" alt="Play">
        `;
    songul.appendChild(li);

    li.addEventListener("click", () => {
      let infoElement = li.querySelector(".info");
      if (infoElement) {
        let songTitle = infoElement.innerText.trim();
        console.log(songTitle);
        playmusic(songTitle);
      } else {
        console.error("Element with class 'info' not found");
      }
    });
  }
}

const playmusic = (track, pause = false) => {
  currentSong.src = `/${cfolder}/` + track;

  if (!pause) {
    currentSong.play();
    play.src = "pause.svg";
  }
  console.log(document.querySelector(".songinfo"));
  document.querySelector(".songinfo").innerText = decodeURI(
    track.replace(".mp3", "")
  ); // Strip ".mp3" if needed
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};


async function displayAlbums() {
  try {
    let response = await fetch(`http://127.0.0.1:5500/songs/`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    let text = await response.text();
    let div = document.createElement("div");
    div.innerHTML = text;

    let anchors = div.getElementsByTagName("a");
    let card_container2 = document.querySelector(".card_container2");

    for (let i = 0; i < anchors.length; i++) {
      let e = anchors[i];
      let folderName = e.href.split('/').filter(Boolean).pop(); // Extract the folder name

      // Check if folderName is valid and not a file
      if (folderName && !folderName.includes('.')) {
        try {
          let fetchResponse = await fetch(
            `http://127.0.0.1:5500/songs/${folderName}/info.json`
          );
          if (!fetchResponse.ok) {
            throw new Error(`HTTP Error: ${fetchResponse.status}`);
          }

          let info = await fetchResponse.json();

          card_container2.innerHTML += `
            <div data-folder="${folderName}" class="card">
              <img src="/songs/${folderName}/model.jpg" alt="Album Cover" />
              <h2 class="music">${info.title}</h2>
              <p>${info.description}</p>
              <div class="play">
                <svg ...>...</svg>
              </div>
            </div>`;
        } catch (error) {
          console.warn(
            `Skipping folder '${folderName}' due to error:`,
            error.message
          );
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch song folders:", error.message);
  }
}




async function main() {
  // Get the list of songs initially
  await getSongs("songs/downloads");
  playmusic(songs[0], true);

  // Display all albums on the page
  await displayAlbums();

  // Attach event listeners to album cards dynamically after they are added
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", async (e) => {
      let folder = e.currentTarget.dataset.folder; // Extract folder name from data attribute
      console.log("Loading songs from folder:", folder);
      await getSongs(`songs/${folder}`); // Pass the correct folder name to getSongs
    });
  });

  // Play, pause, next, and previous functionality
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "pause.svg";
    } else {
      currentSong.pause();
      play.src = "play.svg";
    }
  });

  // Listen for timeupdate event
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondToMinutesSeconds(
      currentSong.currentTime
    )} / ${secondToMinutesSeconds(currentSong.duration)}`;

    let progressPercent = (currentSong.currentTime / currentSong.duration) * 100;

    document.querySelector(".circle").style.left = progressPercent + "%";
    document.querySelector(
      ".seekbar"
    ).style.background = `linear-gradient(to right, rgb(240, 124, 134) ${progressPercent}%, rgb(0, 0, 0) ${progressPercent}%)`;
  });

  // Add an event listener to the seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // Previous song functionality
  previous.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) {
      playmusic(songs[index - 1]);
    }
  });

  // Next song functionality
  next.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) {
      playmusic(songs[index + 1]);
    }
  });

  // Attach volume controls
  document.querySelector(".range input").addEventListener("input", (e) => {
    currentSong.volume = e.target.value / 100;
  });

  // Volume mute/unmute functionality
  document.querySelector(".volume > img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document.querySelector(".range input").value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.1;
      document.querySelector(".range input").value = 10;
    }
  });

  
  
}


main();
