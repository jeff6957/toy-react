
// document.createRange()
//https://www.cnblogs.com/lijinwen/p/6254148.html

const RENDER_TO_DOM = Symbol("render to dom")

// !! 将 vdom 对象转换为实体dom


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

  get vdom() {
    return this.render().vdom;
  }
  // ! 这里加了 vchildren
  // get vchildren() {
  //   return this.children.map(child => child.vdom)
  // }
  [RENDER_TO_DOM](range) {
    // 这里有个递归
    this._range = range;
    this._vdom = this.vdom;
    console.log('Component', range)
    this._vdom[RENDER_TO_DOM](range)
  }
  update(){
    // 对比根节点
    let isSameNode = (oldNode, newNode) => {
      if(oldNode.type !== newNode.type)
        return false;
      for(let name in newNode.props) {
        if(newNode.props[name] !== oldNode.props[name])
          return false;
      }

      if(Object.keys(oldNode.props).length > Object.keys(newNode.props).length)
        return false;

      if(newNode.type === "#text") {
        if(newNode.content !== oldNode.content)
          return false;
      }

      return true;
    }
    let update = (oldNode, newNode) => {
      // 对比 type , props, children
      // #text content
      if(!isSameNode(oldNode, newNode)) {
        console.log('newNode[RENDER_TO_DOM](oldNode._range)', oldNode._range)
        newNode[RENDER_TO_DOM](oldNode._range); //? 这里 oldNode._range 可能不存在
        return;
      }

      newNode._range = oldNode._range; // 直接覆盖？？

      let newChildren = newNode.vchildren;
      let oldChildren = oldNode.vchildren;

      if (!newChildren || !newChildren.length) {
        return;
      }

      let tailRange = oldChildren[oldChildren.length - 1]._range;

      for(let i = 0; i < newChildren.length; i++){
        let newChild = newChildren[i];
        let oldChild = oldChildren[i];
        if(i < oldChildren.length){
          update(oldChild, newChild)
        } else {

          let range = document.createRange();
          range.setStart(tailRange.endContainer, tailRange.endOffset)
          range.setEnd(tailRange.endContainer, tailRange.endOffset)
          // console.log('newChild[RENDER_TO_DOM](range);', range)
          newChild[RENDER_TO_DOM](range);

          tailRange = range;
        }
      }
    }
    let vdom = this.vdom;
    console.warn('====',this._vdom._range, vdom._range)
    update(this._vdom, vdom);
    // update(this._vdom, this.vdom); // 这里 this.vdom 存在对象引用 写错了查了好久
    this._vdom = vdom; // 更新完以后 新的变成旧的了
  }
  /*
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
  */
  setState(newState) {
    if(this.state === null || typeof this.state !== 'object') {
      this.state = newState;
      this.update();
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
    this.update();
  }
}

// 去掉代理 root
// 创建虚拟dom
class ElementWrapper extends Component {
  constructor(type) {
    super(type);
    this.type = type;

    // this.root = document.createElement(type);
  }
  /*
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
  */
  // 获取 虚拟vdom
  get vdom() {
    //  保证最新vchildren
    this.vchildren = this.children.map(child => child.vdom)
    return this;
    /*
    return {
      type: this.type,
      props: this.props,
      children: this.children.map(child => child.vdom)
    }
    */
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    // range.deleteContents();
    // 虚拟dom  到实体dom 更新
    let root = document.createElement(this.type)
    // setAttribute
    for (let name in this.props) {
      let value = this.props[name];
      if (name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
      } else {
        if (name === "className") {
          root.setAttribute("class", value)
        } else {
          root.setAttribute(name, value)
        }
      }
    }
    if (!this.vchildren) {
      this.vchildren = this.children.map(child => child.vdom)
    }
    // appendChild
    for(let child of this.vchildren){
      let childRange = document.createRange();
      childRange.setStart(root, root.childNodes.length); //
      childRange.setEnd(root, root.childNodes.length); // 注意 开始结束  这里选择的是尾部
      child[RENDER_TO_DOM](childRange);
    }

    // range.insertNode(root)
    replaceContent(range, root)
  }
}

class TextNodeWrapper extends Component {
  constructor(content) {
    super(content)
    this.type = '#text';
    this.content = content;
    // this.root = document.createTextNode(content);
  }
  get vdom() {
    return this;
    // return {
    //   type: '#text',
    //   content: this.content,
    // }
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    // range.deleteContents();
    // range.insertNode(this.root)
    let root = document.createTextNode(this.content);
    replaceContent(range, root)
  }
}

// 处理 空 range
function replaceContent(range, node){
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();

  range.setStartBefore(node);
  range.setEndAfter(node);
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
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents()
  component[RENDER_TO_DOM](range)

  console.log('render', component)
}