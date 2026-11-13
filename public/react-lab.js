/* Real React component (locally bundled UMD) with stateful feature selection.
   Deliberately isolated from jQuery-managed DOM so ownership boundaries are clear. */
(function(){'use strict';
  const h=React.createElement;
  const OPTIONS=[{id:'responsive',label:'Responsive layouts',price:120},{id:'animations',label:'Micro-interactions',price:85},{id:'commerce',label:'Commerce flow',price:190},{id:'accessibility',label:'Accessibility audit',price:95}];
  class InterfaceEstimator extends React.Component {
    constructor(props){super(props);this.state={selected:['responsive']};this.toggle=this.toggle.bind(this);this.reset=this.reset.bind(this);}
    toggle(id){this.setState(s=>({selected:s.selected.includes(id)?s.selected.filter(x=>x!==id):[...s.selected,id]}));}
    reset(){this.setState({selected:['responsive']});}
    render(){const selected=this.state.selected,total=240+OPTIONS.filter(x=>selected.includes(x.id)).reduce((s,x)=>s+x.price,0);
      return h('div',null,
        h('span',{className:'field-label'},'SELECT PROJECT FEATURES'),
        h('div',{className:'feature-options'},OPTIONS.map(item=>h('button',{key:item.id,type:'button',className:`feature-option${selected.includes(item.id)?' selected':''}`,onClick:()=>this.toggle(item.id),'aria-pressed':String(selected.includes(item.id))},h('span',null,item.label),h('span',{className:'dot-check'},selected.includes(item.id)?'✓':'+')))),
        h('div',{style:{borderTop:'1px solid #ecf0eb',marginTop:21,paddingTop:14}},
          h('span',{className:'field-label'},'LIVE ESTIMATED PROJECT TOTAL'),
          h('div',{className:'react-price'},'$'+total.toLocaleString(),h('span',null,'example pricing')),
          h('p',{className:'small muted'},`${selected.length} optional ${selected.length===1?'feature':'features'} selected · base $240 · updates on every click`),
          h('button',{type:'button',className:'icon-btn',onClick:this.reset,style:{marginTop:5}},'↺ Reset selection')
        )
      );
    }
  }
  window.ReactLab={mount(id){const node=document.getElementById(id);if(node)ReactDOM.render(h(InterfaceEstimator),node);}};
})();
