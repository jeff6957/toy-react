

class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(name, value) {
    this.root.setAttribute(name, value)
  }
  appendChild(component) {
    this.root.appendChild(component.root)
  }
}

class TextNodeWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._root = null;
  }
  setAttribute(name, value) {
    // 这里存了props 但是没有应用
    this.props[name] = value;
  }
  appendChild(component) {
    this.children.push(component);
  }
  get root () {
    if (!this._root) {
      this._root = this.render().root;
    }
    return this._root;
  }
}


export function createElement(type, attributes, ...children) {
  
  let e;
  if (typeof type == 'string') {
    // 为什么要这样写, 包装一层 统一返回
    e = new ElementWrapper(type);
  } else {
    // !! 如果传进来的是一个类 实例化 得到对象
    e = new type;
  }

  for (let p in attributes) {
    e.setAttribute(p, attributes[p]);
  }
  let insertChildren = (children) => {
    for (let child of children) {
      if (typeof child == 'string') {
        child = new TextNodeWrapper(child);
      }
      if ((typeof child === 'object') && (child instanceof Array)) {
        insertChildren(child)
      } else {
        // 这里添加的 也是 通过createElement 执行得到的返回值
        e.appendChild(child);
      }
    }
  }

  insertChildren(children)

  return e;
}


export function render (component, parentElement) {
  parentElement.appendChild(component.root)
}