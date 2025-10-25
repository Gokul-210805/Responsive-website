   // Simple frontend-only to-do app
    // Features:
    // - Add tasks with optional attached image (drag-drop or file select)
    // - Persist to localStorage
    // - Mark complete, delete, filter, search

    const STORAGE_KEY = 'attractive_todos_v1'
    let pendingImage = null // dataURL for next task if user uploaded image

    // DOM refs
    const addForm = document.getElementById('addForm')
    const taskInput = document.getElementById('taskInput')
    const taskList = document.getElementById('taskList')
    const dropzone = document.getElementById('dropzone')
    const fileInput = document.getElementById('fileInput')
    const search = document.getElementById('search')
    const emptyMsg = document.getElementById('emptyMsg')

    // state
    let tasks = load()
    let filter = 'all'

    // init
    render()

    addForm.addEventListener('submit', () => {
      addTaskFromInput()
    })
    document.getElementById('addBtn').addEventListener('click', addTaskFromInput)

    function addTaskFromInput(){
      const text = taskInput.value.trim()
      if(!text) return
      const newTask = {id:Date.now(), text, done:false, created:new Date().toISOString(), img: pendingImage}
      tasks.unshift(newTask)
      pendingImage = null
      dropzone.classList.remove('hasimg')
      taskInput.value = ''
      save()
      render()
    }

    // dropzone
    dropzone.addEventListener('click', ()=> fileInput.click())
    ;['dragenter','dragover'].forEach(e=>dropzone.addEventListener(e, ev=>{ev.preventDefault();dropzone.classList.add('drag')}))
    ;['dragleave','drop'].forEach(e=>dropzone.addEventListener(e, ev=>{ev.preventDefault();dropzone.classList.remove('drag')}))

    dropzone.addEventListener('drop', ev=>{
      const f = ev.dataTransfer.files && ev.dataTransfer.files[0]
      if(f) readFileAsDataURL(f)
    })

    fileInput.addEventListener('change', ev=>{
      const f = ev.target.files && ev.target.files[0]
      if(f) readFileAsDataURL(f)
      fileInput.value = ''
    })

    function readFileAsDataURL(file){
      if(!file.type.startsWith('image/')) { alert('Please select an image file.'); return }
      const r = new FileReader()
      r.onload = e=>{
        pendingImage = e.target.result
        dropzone.innerHTML = '<strong>Image attached</strong> — it will be added to the next task. Click to change.'
        dropzone.classList.add('hasimg')
      }
      r.readAsDataURL(file)
    }

    // tasks actions
    function toggleDone(id){
      tasks = tasks.map(t=> t.id===id ? {...t, done: !t.done} : t)
      save(); render()
    }
    function removeTask(id){
      if(!confirm('Delete this task?')) return
      tasks = tasks.filter(t=> t.id!==id)
      save(); render()
    }
    function removeImage(id){
      tasks = tasks.map(t=> t.id===id ? {...t, img: null} : t)
      save(); render()
    }

    // clear helpers
    document.getElementById('clearDone').addEventListener('click', ()=>{
      tasks = tasks.filter(t=> !t.done)
      save(); render()
    })
    document.getElementById('clearAll').addEventListener('click', ()=>{
      if(confirm('Clear all tasks?')){ tasks=[]; save(); render() }
    })

    // dark toggle
    document.getElementById('darkToggle').addEventListener('click', ()=>{
      document.body.classList.toggle('dark')
      if(document.body.classList.contains('dark')){
        document.documentElement.style.setProperty('--bg1','linear-gradient(135deg,#0f172a,#0b1220)')
        document.documentElement.style.setProperty('--card','rgba(10,12,18,0.85)')
        document.documentElement.style.setProperty('--muted','#9aa4b2')
      } else {
        document.documentElement.style.setProperty('--bg1','linear-gradient(135deg,#f6d365 0%,#fda085 100%)')
        document.documentElement.style.setProperty('--card','rgba(255,255,255,0.85)')
        document.documentElement.style.setProperty('--muted','#6b7280')
      }
    })

    // filters
    document.querySelectorAll('.filters button').forEach(btn=> btn.addEventListener('click', ()=>{
      document.querySelectorAll('.filters button').forEach(b=> b.classList.remove('active'))
      btn.classList.add('active')
      filter = btn.dataset.filter
      render()
    }))

    // search
    search.addEventListener('input', ()=> render())

    // persistence
    function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) }
    function load(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch(e){ return [] } }

    // render
    function render(){
      const q = search.value.trim().toLowerCase()
      let visible = tasks.filter(t=>{
        if(filter==='active' && t.done) return false
        if(filter==='done' && !t.done) return false
        if(!q) return true
        return t.text.toLowerCase().includes(q)
      })

      taskList.innerHTML = ''
      if(visible.length===0){ emptyMsg.style.display='block' } else { emptyMsg.style.display='none' }

      visible.forEach(t=>{
        const el = document.createElement('div'); el.className='task'
        // image
        if(t.img){
          const img = document.createElement('img'); img.className='thumb'; img.src = t.img; img.alt='task image'
          img.addEventListener('click', ()=>{ if(confirm('Remove image from this task?')) removeImage(t.id) })
          el.appendChild(img)
        }

        const title = document.createElement('div'); title.className='title'; title.textContent = t.text
        el.appendChild(title)

        const meta = document.createElement('div'); meta.className='meta'
        const created = document.createElement('div'); created.textContent = new Date(t.created).toLocaleString(); created.className='muted'
        meta.appendChild(created)
        meta.innerHTML += '<div style="flex:1"></div>'
        if(t.done) meta.innerHTML += '<div class="badge">Completed</div>'
        el.appendChild(meta)

        const actions = document.createElement('div'); actions.className='actions'
        const doneBtn = document.createElement('button'); doneBtn.title='Toggle Done'; doneBtn.innerHTML = t.done ? '↺' : '✓'
        doneBtn.addEventListener('click', ()=> toggleDone(t.id))
        const delBtn = document.createElement('button'); delBtn.title='Delete'; delBtn.innerHTML='✕'
        delBtn.addEventListener('click', ()=> removeTask(t.id))
        actions.appendChild(doneBtn); actions.appendChild(delBtn)
        el.appendChild(actions)

        taskList.appendChild(el)
      })
    }

    // helper: if there is an exported sample image to prefill (nice to see), add a sample task on first run
    if(tasks.length===0){
      const sample = {id:Date.now()+1, text:'Add a friendly task — try attaching an image!', done:false, created:new Date().toISOString(), img:null}
      tasks.push(sample); save(); render()
    }