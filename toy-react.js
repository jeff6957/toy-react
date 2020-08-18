
// document.createRange()
//https://www.cnblogs.com/lijinwen/p/6254148.html

const RENDER_TO_DOM = Symbol("render to dom")
class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(name, value) {

    if (name.match(/^on([\s\S]+)$/)) {
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
    } else {
      if (name === "className") {
        this.root.setAttribute("class", value)
      } else {
        this.root.setAttribute(name, value)
      }
    }

    // this.root.setAttribute(name, value)
  }
  appendChild(component) {
    // this.root.appendChild(component.root)
    let range = document.createRange();
    range.setStart(this.root, this.root.childNodes.length); //
    range.setEnd(this.root, this.root.childNodes.length); // 注意 开始结束  这里选择的是尾部
    component[RENDER_TO_DOM](range);
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root)
  }
}

class TextNodeWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root)
  }
}


// 需要有一个重绘的 render
// 使用 document.createRange()
export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._root = null;

    this._range = null;
  }
  setAttribute(name, value) {
    // 这里存了props 但是没有应用
    this.props[name] = value;
  }
  appendChild(component) {
    this.children.push(component);
  }


  [RENDER_TO_DOM](range) {
    // 这里有个递归
    this._range = range;
    this.render()[RENDER_TO_DOM](range)
  }
  // get root () {
  //   if (!this._root) {
  //     this._root = this.render().root;
  //   }
  //   return this._root;
  // }
  rerender() {
    // 这里有个bug
    // this._range.deleteContents();
    // this[RENDER_TO_DOM](this._range)
    let oldRange = this._range;

    // 1、 创建一个新的 range
    // 2、 把新的rang 放在老的range的位置
    let range = document.createRange();
    // 老的 range 的起点
    range.setStart(oldRange.startContainer, oldRange.startOffset);
    range.setEnd(oldRange.startContainer, oldRange.startOffset);
    this[RENDER_TO_DOM](range); // 插入一次

    // 重设一下起点
    oldRange.setStart(range.endContainer, range.endOffset);
    oldRange.deleteContents();
  }
  setState(newState) {
    if(this.state === null || typeof this.state !== 'object') {
      this.state = newState;
      this.rerender();
      return;
    }

    let merge = (oldState, newState) => {
      for (let p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== 'object') {
          oldState[p] = newState[p];
        } else {
          merge(oldState[p], newState[p])
        }
      }
    }
    merge(this.state, newState)
    this.rerender();
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
      // 注意child 可能为null
      if (child === null) {
        continue;
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
  // parentElement.appendChild(component.root)
  let range = document.createRange();
  range.setStart(parentElement, 0);
  range.setEnd(parentElement, parentElement.childNodes.length)
  component[RENDER_TO_DOM](range)
}