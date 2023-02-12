"use strict";

let map, mapEvent;
class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; //km
    this.duration = duration; //min
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.type = "running";
    this.cadence = cadence; //min
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.type = "cycling";
    this.elevationGain = elevationGain;
    this._setDescription();
    this.calcSpeed();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////
//application architecture

const form = document.getElementById("create_newWorkout_form");
const editForm = document.querySelector(".editForm");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const editInputType = document.querySelector(".editForm__input--type");
const editInputDistance = document.querySelector(".editForm__input--distance");
const editInputDuration = document.querySelector(".editForm__input--duration");
const editInputCadence = document.querySelector(".editForm__input--cadence");
const editInputElevation = document.querySelector(
  ".editForm__input--elevation"
);
const editWorkoutButton = document.querySelector(".editForm__btn");
const closeEditWorkoutBtn = document.querySelector(".closeEditForm__btn");
const createWorkoutButton = document.querySelector(".form__btn");
const sortButton = document.querySelector(".sortbtn");
const deleteAllbtn = document.querySelector(".deleteAllbtn");
const sortContent = document.querySelector(".dropdown-content");
const sidebar = document.querySelector(".sidebar");
const tl = gsap.timeline({
  default: { duration: 0.001 },
});
const closeSidebarBtn = document.querySelector(".sidebar-close");

//
//
class App {
  //private instance
  #map;
  #mapEvent;
  #workouts = [];
  #markers = [];
  #mapZoomLevel = 13;
  constructor() {
    //when the page load, imadiately get the curent position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    inputType.addEventListener("change", this._toggleElevationField.bind(this));
    editInputType.addEventListener(
      "change",
      this._editToggleElevationField.bind(this)
    );
    //move the map to the marker location
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));

    //click the sidebar to hide all the form
    sidebar.addEventListener("click", this._hideAllForm.bind(this));

    //click the edit button on the workout list
    containerWorkouts.addEventListener("click", this._editWorkout.bind(this));

    //click the close button to hide the edit form
    closeEditWorkoutBtn.addEventListener(
      "click",
      this._hideEditForm.bind(this)
    );
    //create new workout
    createWorkoutButton.addEventListener("click", this._newWorkout.bind(this));

    //edit  the workout
    editWorkoutButton.addEventListener(
      "click",
      this._submitEditWorkout.bind(this),
      false
    );

    //show sort out menu
    sortButton.addEventListener("click", this._showSortOutMenu.bind(this));

    //delete all the workouts
    deleteAllbtn.addEventListener("click", this._deleteAllWorkouts.bind(this));

    //close sidebar
    closeSidebarBtn.addEventListener("click", this._hideSidebar.bind(this));
  }
  _getPosition() {
    //allow user location
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("could not get your location");
        }
      );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    // console.log(`https://www.google.com/maps/@${latitude},${longitude},12z`);
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 13);
    // console.log(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    //handing show the form
    this.#map.on("click", this._showForm.bind(this));
    //show localStorage marker
    this.#workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    //mapE is same to "e",and then e is passed to mapEvent
    this.#mapEvent = mapE;

    //when sidebar is hidden,triggle the map to show the sidebar
    document.querySelector(".sidebar").classList.remove("sidebar--hidden");

    //show the create form to create new workout
    form.classList.remove("hidden");

    //this focus turns out that edited form does not workout
    // inputDistance.focus();
  }
  _showEditForm(mapE) {
    //mapE is same to "e",and then e is passed to mapEvent
    this.#mapEvent = mapE;
    editForm.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";

    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }
  _hideAllForm() {
    form !== false ? this._hideForm() : false;
  }
  _hideEditForm() {
    // Empty inputs
    editInputDistance.value =
      editInputDuration.value =
      editInputCadence.value =
      editInputElevation.value =
        "";

    editForm.style.display = "none";
    editForm.classList.add("hidden");
    setTimeout(() => (editForm.style.display = "grid"), 1000);
  }
  _hideSidebar() {
    //using hidden
    sidebar.classList.add("sidebar--hidden");
  }

  _toggleElevationField() {
    //if ''form__row--hidden'' is set remove it, otherwise add it
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }
  _editToggleElevationField() {
    //if ''form__row--hidden'' is set remove it, otherwise add it
    editInputElevation
      .closest(".form__row")
      .classList.toggle("form__row--hidden");
    editInputCadence
      .closest(".form__row")
      .classList.toggle("form__row--hidden");
  }
  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    //if the data get from form can change to number then change to number otherwise return false
    const convertToNumber = (...inputs) => {
      if (inputs.every((inp) => Number(inp))) {
        return inputs.map((inp) => Number(inp));
      } else {
        return false;
      }
    };
    const allPositive = (...inputs) => {
      if (inputs.every((inp) => Number(inp)))
        return inputs.map((inp) => Number(inp)).every((inp) => inp > 0);
    };
    e.preventDefault();

    //get data from the form
    const type = inputType.value;
    let distance = inputDistance.value;
    let duration = inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    // console.log(distance, duration, inputCadence.value);

    //if workout running,create running object
    if (type === "running") {
      let cadence = inputCadence.value;
      //check data validation
      if (
        !validInputs(distance, duration, cadence) &&
        allPositive(distance, duration, cadence)
      ) {
        //change the string data to number
        let nowData = convertToNumber(distance, duration, cadence);
        if (!nowData) return alert("Inputs have to be a positive number");
        [distance, duration, cadence] = nowData;

        //push the data to the running object
        workout = new Running([lat, lng], distance, duration, cadence);
      } else {
        return alert("Inputs have to be a positive number");
      }
    }

    //if workout cycling,create cycling object
    if (type === "cycling") {
      let elevation = inputElevation.value;
      //check data validation
      if (
        !validInputs(distance, duration, elevation) &&
        allPositive(distance, duration, elevation)
      ) {
        //change the string data to number
        let nowData = convertToNumber(distance, duration, elevation);
        if (!nowData) return alert("Inputs have to be a positive number");
        [distance, duration, elevation] = nowData;
        //push the data to the running object
        workout = new Cycling([lat, lng], distance, duration, elevation);
      } else {
        return alert("Inputs have to be a positive number");
      }
    }

    //add running or cyclinig object to workouts array
    this.#workouts.push(workout);

    //render workout on map as marker
    this._renderWorkoutMarker(workout);

    //render workout on list
    this._renderWorkout(workout);

    const index = this.#workouts.indexOf(workout);
    //get the dom element of render workout and make animation
    setTimeout(() => {
      const resentWorkout = document.querySelector(
        `body > div.sidebar > ul.workouts > li:nth-child(${
          this.#workouts.length - index + 1
        })`
      );
      tl.fromTo(
        resentWorkout,
        { opacity: 0, x: -200 },
        { opacity: 0.75, x: 0 }
      );
    }, 10);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
    this.#markers.push(marker);
  }

  _renderWorkout(workout) {
    let html = `

      <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">

        <span class="workout__icon">${
          workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>

        </div>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⌛</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;
    if (workout.type === "running")
      html += `
          <div class="workout__details">
            <span class="workout__icon">🌟</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>

          <div class='workout__menuEdit'>edit</div>
          <div class='workout__menuDelete'>delete</div>
        </li>
        `;
    if (workout.type === "cycling")
      html += `
        <div class="workout__details">
          <span class="workout__icon">🌟</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🗻</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
        <div class='workout__menuEdit'>edit</div>
        <div class='workout__menuDelete'>delete</div>
      </li>
      `;
    // form.innerHTML = html;
    form.insertAdjacentHTML("afterend", html);
  }
  _workoutAnimation(workout) {
    const index = this.#workouts.indexOf(workout);
    //get the dom element of render workout and make animation
    setTimeout(() => {
      const resentWorkout = document.querySelector(
        `body > div.sidebar > ul.workouts > li:nth-child(${
          this.#workouts.length - index + 1
        })`
      );
      tl.fromTo(
        resentWorkout,
        { opacity: 0, x: -200 },
        { opacity: 0.75, x: 0 },
        "<"
      );
    }, 10);
  }
  _moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    e.stopPropagation();
    if (!this.#map) return;

    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the public interface
    // workout.click();
  }

  //edit the workout list
  _editWorkout(e) {
    e.preventDefault();
    e.stopPropagation();

    const workoutEl = e.target.closest(".workout");
    if (!workoutEl) return;
    this.workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    const editButton = workoutEl.querySelector(".workout__menuEdit");
    editButton.addEventListener("click", this._showEditForm.bind(this));
    const deleteButton = workoutEl.querySelector(".workout__menuDelete");
    deleteButton.addEventListener("click", this._deleteWorkout.bind(this));
  }
  _submitEditWorkout(e) {
    // e.preventDefault();
    // e.stopPropagation();
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    //if the data get from form can change to number then change to number otherwise return false
    const convertToNumber = (...inputs) => {
      if (inputs.every((inp) => Number(inp))) {
        return inputs.map((inp) => Number(inp));
      } else {
        return false;
      }
    };
    const allPositive = (...inputs) => {
      if (inputs.every((inp) => Number(inp)))
        return inputs.map((inp) => Number(inp)).every((inp) => inp > 0);
    };
    //get the data from editForm
    const editType = editInputType.value;
    let editDistance = editInputDistance.value;
    let editDuration = editInputDuration.value;
    const [lat, lng] = this.workout.coords;
    let editWorkout;

    //if workout running,create running object
    if (editType === "running") {
      let cadence = editInputCadence.value;
      //check data validation
      if (
        !validInputs(editDistance, editDuration, cadence) &&
        allPositive(editDistance, editDuration, cadence)
      ) {
        //change the string data to number
        let nowData = convertToNumber(editDistance, editDuration, cadence);
        if (!nowData) return alert("Inputs have to be a positive number");
        [editDistance, editDuration, cadence] = nowData;
        //push the data to the running object
        editWorkout = new Running(
          [lat, lng],
          editDistance,
          editDuration,
          cadence
        );
      } else {
        return alert("Inputs have to be a positive number");
      }
    }

    //if workout cycling,create cycling object
    if (editType === "cycling") {
      let elevation = editInputElevation.value;
      //check data validation
      if (
        !validInputs(editDistance, editDuration, elevation) &&
        allPositive(editDistance, editDuration, elevation)
      ) {
        //change the string data to number
        let nowData = convertToNumber(editDistance, editDuration, elevation);
        if (!nowData) return alert("Inputs have to be a positive number");
        [editDistance, editDuration, elevation] = nowData;
        //push the data to the running object
        editWorkout = new Cycling(
          [lat, lng],
          editDistance,
          editDuration,
          elevation
        );
      } else {
        return alert("Inputs have to be a positive number");
      }
    }
    //remove edited workout
    this._deleteWorkout(this.#mapEvent);

    //push newWorkout in array
    this.#workouts.push(editWorkout);

    //render workout on map as marker
    this._renderWorkoutMarker(editWorkout);

    //render workout on list
    this._renderWorkout(editWorkout);

    // Hide form + clear input fields
    this._hideEditForm();
  }
  _deleteWorkout(e) {
    // e.stopPropagation();
    //remove original workout
    this._removeRenderWorkout();

    //remove original workout marker
    this._removeRenderWorkoutMarker();

    //add running or cyclinig object to workouts array
    //remove original workout
    const index = this.#workouts.indexOf(this.workout);
    if (index > -1) {
      // only splice array when item is found
      this.#workouts.splice(index, 1); // 2nd parameter means remove one item only
    }
  }
  _removeRenderWorkoutMarker() {
    const index = this.#workouts.indexOf(this.workout);
    const marker = this.#markers.at(index);
    this.#map.removeLayer(marker);
    if (index > -1) {
      // only splice array when item is found
      this.#markers.splice(index, 1); // 2nd parameter means remove one item only
    }
  }
  _removeRenderWorkout() {
    //use id to get the edited workout item
    const index = this.#workouts.indexOf(this.workout);

    //get the dom element of edited render workout list,and use remove to delete the element
    // const editedWorkout = document.querySelector(
    //   `body > div.sidebar > ul.workouts > li:nth-child(${
    //     this.#workouts.length - index + 1
    //   })`
    // );
    const resentWorkout = document.querySelector(
      `body > div.sidebar > ul.workouts > li:nth-child(${
        this.#workouts.length - index + 1
      })`
    );
    setTimeout(() => {
      tl.to(resentWorkout, { opacity: 0, x: 500 });
    }, 100);
    resentWorkout.remove();
  }
  _showSortOutMenu() {
    //show the sort out menu
    sortContent.classList.toggle("dropdown-content--hidden");

    //triggle the sort out event
    const sortDistance = document.querySelector(".sort-content-distance");
    const sortDuration = document.querySelector(".sort-content-duration");
    const sortType = document.querySelector(".sort-content-type");

    //sort all the workout by distance
    sortDistance.addEventListener("click", this._sortOutDistance.bind(this));

    //sort all the workout by duration
    sortDuration.addEventListener("click", this._sortOutDuration.bind(this));

    //sort all the workout by type
    sortType.addEventListener("click", this._sortOutType.bind(this));
  }
  _sortoutFunction(item) {
    //sort downsending
    return function (arr1, arr2) {
      let a = arr1[`${item}`];
      let b = arr2[`${item}`];
      return a - b; //down
    };
  }
  _sortOutDistance() {
    //rank
    this.#workouts.sort(this._sortoutFunction("distance"));

    //render sorted workouts
    this._showSortOutResult(this.#workouts);
  }
  _sortOutDuration() {
    //rank
    this.#workouts.sort(this._sortoutFunction("duration"));

    //render sorted workouts
    this._showSortOutResult(this.#workouts);
  }
  _sortOutType() {
    //deep copy of this.#workout
    let workoutDeepcopy = JSON.parse(JSON.stringify(this.#workouts));

    // create a typeId to recognize the type of workout
    for (let i = 0; i < this.#workouts.length; i++) {
      workoutDeepcopy[i].type === "running"
        ? (workoutDeepcopy[i]["typeId"] = 0)
        : (workoutDeepcopy[i]["typeId"] = 1);
    }

    workoutDeepcopy.sort(this._sortoutFunction("typeId"));

    //render sorted workouts
    this._showSortOutResult(workoutDeepcopy);
  }
  _showSortOutResult(array) {
    //remove original rank render workout
    const originalWorkouts = [];
    for (let i = 0; i < array.length; i++) {
      const originalWorkout = document.querySelector(
        `body > div.sidebar > ul.workouts > li:nth-child(${i + 2})`
      );
      originalWorkouts.push(originalWorkout);
    }
    originalWorkouts.forEach((elm) => elm.remove());

    //render new sorted workout
    array.forEach((elm) => {
      this._renderWorkout(elm);
    });
  }
  _deleteAllWorkouts() {
    //alert
    var r = confirm("please make sure to clear all the workouts");
    console.log(r);
    if (r == true) {
      this.reset();
    } else {
      return false;
    }
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    this.#workouts = data;

    //render every workout in the sidebar and use gsap animation
    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
      this._workoutAnimation(work);
    });
  }
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

const app = new App();
