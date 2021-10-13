const successStatus = 'OK';

class Controller {
  constructor(view, model) {
    this.view = view;
    this.model = model;
  }

  init() {
    this.view.initListeners(this);
  }

  async addNewUser(nameInput, countInput) {
    const self = this;
    try {
      const name = nameInput.value;
      const count = countInput.value;

      const response = await fetch(`https://codeforces.com/api/user.status?handle=${name}&from=1&count=${count}`);
      const { status, result } = await response.json();
      this.model.addNewUser(result, name, self.view.render.bind(self.view));
    } catch (error) {
      console.warn(error, 'error');
    }
  }
}

class Model {
  constructor() {
    this.data = {};
    this.handles = [];
  }

  addNewUser(userResult, name, callback) {
    if (this.data[name]) {
      return;
    }
    const allContestsId = userResult.filter((contest, idx, self) =>
      idx === self.findIndex((t) => t.contestId === contest.contestId)).map(item => item.contestId);
    let result = {};
    result[name] = allContestsId.map(item => {
      let tmpCount = 0;
      for (let index = 0; index < userResult.length; index++) {
        const element = userResult[index];
        if (element.contestId === item) {
          tmpCount += 1;
        }
      }
      return {
        id: item,
        count: tmpCount,
        verdict: userResult.find(contest => (
          Number(item) === contest.contestId && contest.verdict === successStatus)
        ) ? 'OK' : 'FAIL',
      }
    });

    if (this.handles.length) {
      this.handles.forEach(() => {
        result[name].unshift({ id: '', count: '', verdict: '' });
      });
    }

    this.data = { ...this.data, ...result };
    this.handles = [...new Set([...this.handles, ...allContestsId])];
    console.log(this.data, this.handles, 'result')
    callback(this.data, this.handles);
  }
}

class View {
  constructor() {
    this.addBtn = null;
    this.nameInput = document.getElementById('name');
    this.countInput = document.getElementById('count');
    this.thead = document.getElementById("thead");
    this.tbody = document.getElementById("tbody");
  }

  initListeners(controllerCtx) {
    const addBtn = document.getElementById('btn');
    addBtn.addEventListener('click', () => {
      controllerCtx.addNewUser(this.nameInput, this.countInput);
    });
  }

  clearInputs() {
    this.countInput.value = '';
    this.nameInput.value = '';
  }

  renderThead(headData) {
    this.thead.innerHTML = null;
    for (let index = -1; index < headData.length; index++) {
      const el = headData[index];
      const th = document.createElement("th");
      if (index >= 0) {
        this.thead.appendChild(th);
        th.innerHTML = el;
      }
      this.thead.appendChild(th);
    }
  }

  renderTbody(bodyData) {
    this.tbody.innerHTML = null;
    Object.keys(bodyData).forEach(item => {
      const element = bodyData[item];
      const tr = document.createElement('tr');
      const nameTd = document.createElement('td');
      nameTd.innerHTML = item;
      tr.appendChild(nameTd);
      element.forEach(cell => {
        const td = document.createElement('td');
        td.className = cell.verdict.toLowerCase();
        td.innerHTML = cell.verdict === successStatus ? '+' : cell.count;
        tr.appendChild(td);
      });
      this.tbody.appendChild(tr);
    });
  }

  render(bodyData, headData) {
    this.clearInputs();

    this.renderThead(headData);
    this.renderTbody(bodyData);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const model = new Model();
  const view = new View();
  const controller = new Controller(view, model);
  controller.init();
});
