// new Proxy(obj,{
//   get(){},
//   set(){},
//   deleteProperty(){}
// })

const isObject = v => typeof v === 'object' && v !== null

function reactive(obj){
  if(!isObject){
    return obj
  }
  return new Proxy(obj,{
    get(target,key){
      console.log('get',key)
      const res = Reflect.get(target,key)
      // 依赖收集
      track(target,key)
      // 懒处理
      return isObject(res) ? reactive(res) : res
    },
    set(target,key,val){
      console.log('set',key)
      const res = Reflect.set(target,key,val)
      trigger(target,key)
      return res
    },
    deleteProperty(target,key){
      console.log('deleteProperty', key)
      const res = Reflect.deleteProperty(target,key)
      trigger(target,key)
      return res
    }
  })
}


// 创建响应式数据和副作用函数之间的依赖关系

// 临时保存响应式
const effectStack = []

// effect: 添加副作用函数
function effect(fn){
  const eff = function(){
    try{
      effectStack.push(eff)
      fn()
    }finally{
      effectStack.pop()
    }
  }
  eff()
  return eff
}

// 存储依赖关系的map
const targetMap = new WeakMap()

// 依赖收集：track()
function track(target,key){
  const eff = effectStack[effectStack.length -1]
  if(eff){
    // 1、获取target对应的map
    let depMap = targetMap.get(target)
    if(!depMap){
      // 首次访问不存在，则创建
      depMap = new Map()
      targetMap.set(target,depMap)
    }
    // 2、获取key对应的set
    let deps = depMap.get(key)
    if(!deps){
      // 首次访问不存在，则创建
      deps = new Set()
      depMap.set(key,deps)
    }
    // 3、建立target，key和eff之间的关系
    deps.add(eff)
  }
}

// 依赖触发
function trigger(target,key){
  // 通过target获取map
  const depMap = targetMap.get(target)
  if(depMap){
    // 通过key获取deps
    const deps = depMap.get(key)
    if(deps){
      // 执行所有副作用
      deps.forEach(dep => dep())
    }
  }
}

// const state = reactive({
//   foo: 'foo000000',
//   bar: {
//     baz: 'baz1111'
//   }
// })

// state.foo 
// state.foo = 'pppp'
// delete state.foo

// effect(() => {
//   console.log(state.foo, state.bar.baz, '啊啊啊啊啊')
// })

// // state.foo = 'pppp'
// state.bar.baz = 'baz2222222'