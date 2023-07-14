class NamePicker {
  constructor(handleError) {
    this.names = {};
    this.totalWeight = 0;
    this.handleError = handleError;
  }

  checkWeight(weight) {
    return weight >= 0;
  }

  addName(name, weight) {
    if (this.names.hasOwnProperty(name)) {
      this.handleError("Name already exists");
      return;
    }

    if (!this.checkWeight(weight)) {
      this.handleError("Weight cannot be negative");
      return;
    }

    this.names[name] = weight;
    this.totalWeight += weight;
  }

  updateWeight(name, weightChange) {
    if (!this.names.hasOwnProperty(name)) {
      this.handleError("Name doesnt exist");
      return null;
    }

    const oldWeight = this.names[name];

    if (!this.checkWeight(oldWeight + weightChange)) {
      this.handleError("Weight cannot be negative");
      return oldWeight;
    }

    this.names[name] += weightChange;
    this.totalWeight += weightChange;
    return this.names[name];
  }

  pickRandomName() {
    if (this.totalWeight <= 0) {
      this.handleError("No names were found");
      return null;
    }

    let randomNumber = Math.floor(Math.random() * this.totalWeight);

    for (const name in this.names) {
      const weight = this.names[name];
      randomNumber -= weight;

      if (randomNumber < 0) {
        return name;
      }
    }

    return null;
  }
}

async function getAllUsers() {
  try {
    const userData = {
      email: "",
      password: "",
    };

    const auth = await fetch("https://api.devpipeline.org/user/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const authObject = await auth.json();
    const authToken = authObject.auth_info.auth_token;

    const res = await fetch("https://api.devpipeline.org/users", {
      headers: { auth_token: authToken },
    });

    const allUsers = await res.json();
    return allUsers.users;
  } catch (error) {
    console.error("Error: ", error);
  }
}

const nameTemplate = document
  .getElementsByTagName("template")[0]
  .content.querySelector("div");

async function addNames(nameList) {
  const loadingNamesElement = document.createElement("h1");
  loadingNamesElement.className = "loading-names";
  loadingNamesElement.textContent = "Loading names...";
  nameList.appendChild(loadingNamesElement);
  nameButton.disabled = true;

  const users = await getAllUsers();

  nameList.removeChild(loadingNamesElement);
  nameButton.disabled = false;

  for (const user of users) {
    let name = `${user.first_name} ${user.last_name}`;
    let weight = 1;

    namePicker.addName(name, weight);

    const nameWrapper = document.importNode(nameTemplate, true);

    const [decrementButton, incrementButton] =
      nameWrapper.querySelectorAll(".weight-btn");

    const nameElement = nameWrapper.querySelector(".name-text");
    nameElement.textContent = name;
    const weightElement = nameWrapper.querySelector(".weight-text");
    weightElement.textContent = weight;

    decrementButton.addEventListener("click", () => {
      const newWeight = namePicker.updateWeight(name, -1);
      weightElement.textContent = newWeight;
    });

    incrementButton.addEventListener("click", () => {
      const newWeight = namePicker.updateWeight(name, 1);
      weightElement.textContent = newWeight;
    });

    nameList.appendChild(nameWrapper);
  }
}

function selectName(name, nameList) {
  for (nameWrapper of nameList.children) {
    const nameElement = nameWrapper.querySelector(".name-text");
    nameElement.className = `name-text${
      nameElement.textContent === name ? " selected" : ""
    }`;
  }
}

function deselectAllNames(nameList) {
  selectName(null, nameList);
}

const nameButton = document.getElementsByClassName("choose-name-btn")[0];
const nameSelected = document.getElementsByClassName("selected-name")[0];
const nameList = document.getElementsByClassName("name-list")[0];

let namePicker = new NamePicker((message) => window.alert(message));

addNames(nameList);

nameButton.addEventListener("click", () => {
  nameButton.disabled = true;
  deselectAllNames(nameList);
  let count = 10;

  const intervalId = setInterval(() => {
    const name = namePicker.pickRandomName();
    if (name) {
      nameSelected.textContent = name;
    }

    count--;
    if (count === 0 || !name) {
      clearInterval(intervalId);
      nameButton.disabled = false;
      selectName(name, nameList);
    }
  }, 100);
});
