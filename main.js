
import { createElement, Component, render } from './toy-react';

// MyComponnent 是一个类  如何渲染成dom

// MyComponnent render 部分jsx 语法转换后

// createElement("div", null, createElement("h1", null, "my Component"), this.children)
// !! 这里 createElement 出来的就是一个节点了, 被 父类 Component 的 get root 内部调用了 render 获得了对应dom

class MyComponnent extends Component {
  render () {
    return <div>
      <h1>my Component</h1>
      {this.children}
    </div>
  }
}


// rac.createElement(MyComponnent, {
//   id: 'a',
//   "class": "c",
// }, createElement("div", null, "abc"), createElement("div", null), createElement("div", null))


render(<MyComponnent id="a" class="b">
  <div>sfasdf</div>
  <div></div>
  <div></div>
</MyComponnent>, document.body)

/** dd
 * 
 */


