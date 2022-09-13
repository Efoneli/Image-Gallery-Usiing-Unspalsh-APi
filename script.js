//////////////////////////////////////
///////////SKELETON LOADING///////////
//////////////////////////////////////

const networkCall = () =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, 5000);
    // reject({ message: "This is an error" });
  });

const skeleton = document.querySelector("#skel-container");

// Display skeleton content only
skeleton.classList.add("showing");

networkCall()
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.log(error);
  })
  .finally(() => {
    console.log("Call completed (error or succes)");
    // Display main content only
    skeleton.classList.remove("showing");
  });


////////////////////////////////////////
///////////MAIN IMAGE GALLERY///////////
////////////////////////////////////////


const unsplash = new UnspashClient();
const urlParams = new URLSearchParams(location.search);

const photoContainer = document.querySelector("#photo-container");
const photoColumns = Array.from(
  photoContainer.querySelectorAll(".photo-container-column")
);
const searchForm = document.querySelector("#search-form");
const searchInput = searchForm.querySelector("input");
const skelContainer = document.querySelector("#skel-container")
const photoArray = [];
let photoModal = null;

if (urlParams.has("query")) {
  unsplash.searchParam = urlParams.get("query") || "";
  searchInput.value = unsplash.searchParam;
}

const showModal = (card) => {
  const photoModalProps = {
    imageUrl: card.props.regularImageUrl,
    description: card.props.description,
    caption: card.props.caption,
  };

  if (!photoModal) {
    photoModal = new PhotoModal(photoModalProps);
    document.body.append(photoModal.element);
  } else {
    photoModal.update(photoModalProps);
  }

  console.log("Showing the modal", card.props.caption);
  setTimeout(() => {
    photoModal.open();
  }, 0);
}; //end function showModal

const renderPhotos = () => {
  unsplash.getImages().then((images) => {
    photoArray.forEach((card) => {
      card.destroy();
    });
    photoArray.splice(0, photoArray.length);
    images.forEach((image, imageIndex) => {
      const card = new PhotoCard({
        imageUrl: image.urls.small,
        regularImageUrl: image.urls.regular,
        description: image.description,
        caption: image.user.name,
        clickEventListener: () => {
          showModal(card);
        },
      });
      photoArray.push(card);
      photoColumns[imageIndex % photoColumns.length].append(card.element);
    });
  });
}; //end function renderPhotos

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  unsplash.searchParam = searchInput.value || "";

  const currentUrl = location.origin + location.pathname;
  const params = new URLSearchParams(location.search);
  params.set("query", unsplash.searchParam);
  history.pushState({}, null, `${currentUrl}?${params.toString()}`);

  skeleton.classList.add("showing");

  networkCall()
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.log(error);
  })
  .finally(() => {
    console.log("Call completed (error or succes)");
    // Display main content only
    skeleton.classList.remove("showing");
  });

  renderPhotos();
});

renderPhotos();

////////////////////////////////////////////////////////////////
///////////Photo Modal /////////////////////////
/////////////////////////////////////////////////////////////////
function PhotoModal(props) {
  const innerHtml = `
    <div class="photo-modal">
        <div ref-modal-content class="photo-modal-content shadow-lg relative">
            <button type='submit' ref-close-button class="bg-white h-10 w-10 absolute shadow-lg right-4 top-4 rounded-full font-medium text-2xl text-gray-500">&times;</button>
            <img ref-main-img class="w-full h-[350px] object-cover object-position-center" src="${props.imageUrl}" alt="">
            <div class="bg-white p-8 text-gray-600">
                <h4 ref-description class="">${props.description}</h4>
                <h6 ref-caption class="font-medium text-xs">${props.caption}</h6>
            </div>
        </div>
    </div>`;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = innerHtml;

  this.props = props;
  this.element = wrapper.firstElementChild;
  const closeButton = this.element.querySelector("[ref-close-button]");
  const modalContent = this.element.querySelector("[ref-modal-content]");
  const mainImage = this.element.querySelector("[ref-main-img]");
  const description = this.element.querySelector("[ref-description]");
  const caption = this.element.querySelector("[ref-caption]");

  this.update = (props) => {
    Object.assign(this.props, props);
    mainImage.src = "";
    setTimeout(() => {
      mainImage.src = this.props.imageUrl;
    }, 0);
    description.textContent = this.props.description;
    caption.textContent = this.props.caption;
  };

  this.open = () => {
    this.element.classList.add("showing");
  };

  this.close = () => {
    this.element.classList.remove("showing");
  };

  closeButton.addEventListener("click", () => {
    this.close();
  });

  const documentOutsideClickEventListener = (event) => {
    if (event.composedPath().some((el) => el == modalContent)) return;

    this.close();
  };

  document.addEventListener("click", documentOutsideClickEventListener, true);

  this.destroy = () => {
    document.removeEventListener("click", documentOutsideClickEventListener);

    if (this.element && document.contains(this.element)) this.element.remove();
  };
} //end photoCard

////////////////////////////////////////////////////////////////
///////////Photo Card /////////////////////////
/////////////////////////////////////////////////////////////////
function PhotoCard(props) {
  const innerHtml = `
        <article class="rounded-md overflow-hidden">
            <figure class="relative">
                <img class="w-full h-auto transform transition hover:scale-[1.05]" src="${props.imageUrl}" alt="">
                <span class="absolute left-0 bottom-0 p-4 text-white font-medium text-sm block w-full bg-gradient-to-t from-gray-700 via-gray-700/70 to-transparent"><caption>${props.caption}</caption></span>
            </figure>
        </article>`;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = innerHtml;

  this.props = props;
  this.element = wrapper.firstElementChild;

  this.element.addEventListener("click", props.clickEventListener);

  this.destroy = () => {
    if (this.element && document.contains(this.element)) this.element.remove();
  };
} //end photoCard

// ////////////////////////////////////////////////////////////////
///////////UNSPLASH LOGIC /////////////////////////
/////////////////////////////////////////////////////////////////
function UnspashClient() {
  const clientID = `1yVn9GGqy5nul0FEYp11pSC-bgDvA6BHkETjsZbva80`;
  const client = axios.create({
    baseURL: "https://api.unsplash.com",
    headers: {
      Authorization: `Client-ID ${clientID}`,
    },
  });

  const randomPath = "/photos";
  const searchPath = "/search/photos";

  this.searchParam = "";

  const getPathUrl = () => {
    const query = this.searchParam;

    const params = {
      per_page: 100,
      query,
    };

    const baseUrl = this.searchParam ? searchPath : randomPath;
    const paramString = Object.keys(params).reduce((acc, curr) => {
      return `${acc}&${curr}=${encodeURI(params[curr])}`.replace(
        /(^&+)|(&+$)/g,
        ""
      );
    }, "");

    return `${baseUrl}?${paramString}`;
  };

  this.getImages = () => {
    return client.get(getPathUrl()).then((response) => {
      return response.data.results ?? response.data;
    });
  };
} //end function UnsplashClient
