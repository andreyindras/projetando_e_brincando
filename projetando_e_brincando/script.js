// Estado da aplicação
let currentComponents = {};
let currentGames = {};
let draggedElement = null;
let dragOffset = { x: 0, y: 0 };

// Formas básicas disponíveis
const basicShapes = [
    { id: 'circle', name: 'Círculo', icon: '⭕', color: '#ff6b6b' },
    { id: 'square', name: 'Quadrado', icon: '🟦', color: '#4ecdc4' },
    { id: 'triangle', name: 'Triângulo', icon: '🔺', color: '#45b7d1' },
    { id: 'rectangle', name: 'Retângulo', icon: '🟪', color: '#96ceb4' },
    { id: 'diamond', name: 'Losango', icon: '🔷', color: '#feca57' },
    { id: 'star', name: 'Estrela', icon: '⭐', color: '#ff9ff3' },
    { id: 'line', name: 'Linha', icon: '➖', color: '#000000' },
    { id: 'hexagon', name: 'Hexágono', icon: '⬡', color: '#54a0ff' }
];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    createShapesGrid();
    loadSavedData();
    setupEventListeners();
});

// Gerenciamento de abas
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Atualiza componentes disponíveis na aba de jogos
            if (targetTab === 'game-creator') {
                updateComponentsSelection();
            }
        });
    });
}

// Criação da grade de formas básicas
function createShapesGrid() {
    const shapesGrid = document.getElementById('shapesGrid');
    shapesGrid.innerHTML = '';

    basicShapes.forEach(shape => {
        const shapeElement = document.createElement('div');
        shapeElement.className = 'shape';
        shapeElement.draggable = true;
        shapeElement.dataset.shapeId = shape.id;
        
        shapeElement.innerHTML = `
            <div class="shape-icon" style="color: ${shape.color}">${shape.icon}</div>
            <div class="shape-name">${shape.name}</div>
        `;
        
        // Event listeners para drag and drop
        shapeElement.addEventListener('dragstart', handleShapeDragStart);
        shapeElement.addEventListener('dragend', handleDragEnd);
        
        shapesGrid.appendChild(shapeElement);
    });
}

// Configuração de event listeners
function setupEventListeners() {
    // Área de montagem de componentes
    const shapeAssemblyArea = document.getElementById('shapeAssemblyArea');
    shapeAssemblyArea.addEventListener('dragover', handleDragOver);
    shapeAssemblyArea.addEventListener('drop', handleShapeDrop);
    shapeAssemblyArea.addEventListener('dragleave', handleDragLeave);

    // Área de montagem de jogos
    const gameAssemblyArea = document.getElementById('gameAssemblyArea');
    gameAssemblyArea.addEventListener('dragover', handleDragOver);
    gameAssemblyArea.addEventListener('drop', handleGameDrop);
    gameAssemblyArea.addEventListener('dragleave', handleDragLeave);

    // Botões de controle
    document.getElementById('clearShapeAssembly').addEventListener('click', clearShapeAssembly);
    document.getElementById('saveComponent').addEventListener('click', showComponentForm);
    document.getElementById('clearGameAssembly').addEventListener('click', clearGameAssembly);
    document.getElementById('saveGame').addEventListener('click', showGameForm);

    // Formulários
    document.getElementById('confirmComponent').addEventListener('click', saveComponent);
    document.getElementById('confirmGame').addEventListener('click', saveGame);
}

// Handlers de drag and drop para formas
function handleShapeDragStart(e) {
    draggedElement = {
        type: 'shape',
        data: basicShapes.find(s => s.id === e.target.dataset.shapeId)
    };
    e.dataTransfer.effectAllowed = 'copy';
}

function handleComponentDragStart(e) {
    const componentId = e.target.dataset.componentId;
    draggedElement = {
        type: 'component',
        data: currentComponents[componentId]
    };
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', ''); // Para compatibilidade
}

function handleDragEnd(e) {
    draggedElement = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
        e.currentTarget.classList.remove('dragover');
    }
}

function handleShapeDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    if (!draggedElement || draggedElement.type !== 'shape') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 30; // Ajuste para centralizar
    const y = e.clientY - rect.top - 30;
    
    addShapeToAssembly(draggedElement.data, x, y);
    updateComponentPreview();
}

function handleGameDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    if (!draggedElement || draggedElement.type !== 'component') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 40;
    const y = e.clientY - rect.top - 40;
    
    addComponentToGameAssembly(draggedElement.data, x, y);
    updateGamePreview();
}

// CORRIGIDO - addShapeToAssembly
function addShapeToAssembly(shape, x, y) {
    const assemblyArea = document.getElementById('shapeAssemblyArea');
    const shapeElement = document.createElement('div');
    const shapeId = `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    shapeElement.className = 'assembly-element';
    shapeElement.dataset.shapeId = shape.id;
    shapeElement.dataset.uniqueId = shapeId;
    shapeElement.style.position = 'absolute';
    shapeElement.style.left = `${Math.max(0, Math.min(x, assemblyArea.clientWidth - 60))}px`;
    shapeElement.style.top = `${Math.max(0, Math.min(y, assemblyArea.clientHeight - 60))}px`;
    shapeElement.style.width = '60px';
    shapeElement.style.height = '60px';
    shapeElement.style.cursor = 'pointer';

    const figureContent = createShapeContent(shape);

    shapeElement.innerHTML = `
        <div class="element-content">
            ${figureContent}
        </div>
        <div class="element-controls">
            <button class="control-btn delete-btn" onclick="event.stopPropagation(); removeShape('${shapeId}')">×</button>
            <button class="control-btn rotate-btn" onclick="event.stopPropagation(); rotateShape('${shapeId}')">⟳</button>
            <button class="control-btn color-btn" onclick="event.stopPropagation(); toggleColorPicker('${shapeId}')">🎨</button>
        </div>
        <input type="color" class="color-picker hidden" id="colorPicker-${shapeId}" onchange="changeShapeColor('${shapeId}', this.value)" />
        <div class="resize-handle"></div>
    `;

    shapeElement.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(shapeElement);
    });

    makeElementDraggable(shapeElement);
    makeElementResizable(shapeElement);

    assemblyArea.appendChild(shapeElement);
}

// CORRIGIDO - Adicionar componente à área de montagem do jogo
function addComponentToGameAssembly(component, x, y) {
    const assemblyArea = document.getElementById('gameAssemblyArea');
    const componentElement = document.createElement('div');
    const componentId = `game-comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    componentElement.className = 'assembly-component';
    componentElement.dataset.componentId = component.id;
    componentElement.dataset.uniqueId = componentId;
    componentElement.style.position = 'absolute';
    componentElement.style.left = `${Math.max(0, Math.min(x, assemblyArea.clientWidth - 80))}px`;
    componentElement.style.top = `${Math.max(0, Math.min(y, assemblyArea.clientHeight - 80))}px`;
    componentElement.style.width = '80px';
    componentElement.style.height = '80px';
    componentElement.style.border = '2px solid #007bff';
    componentElement.style.borderRadius = '8px';
    componentElement.style.backgroundColor = '#f8f9fa';
    componentElement.style.display = 'flex';
    componentElement.style.flexDirection = 'column';
    componentElement.style.alignItems = 'center';
    componentElement.style.justifyContent = 'center';
    componentElement.style.cursor = 'move';
    
    // Criar preview visual do componente baseado nas suas formas
    const componentPreview = createComponentPreview(component);
    
    componentElement.innerHTML = `
        <div class="component-preview" style="width: 100%; height: 60%; position: relative; overflow: hidden;">
            ${componentPreview}
        </div>
        <div style="font-size: 0.7rem; text-align: center; margin-top: 2px; font-weight: bold;">${component.name}</div>
        <button onclick="event.stopPropagation(); removeGameComponent('${componentId}')" 
                style="position: absolute; top: -8px; right: -8px; background: #dc3545; color: white; 
                       border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; 
                       cursor: pointer; z-index: 10;">×</button>
    `;
    
    makeElementDraggable(componentElement);
    assemblyArea.appendChild(componentElement);
}

// NOVO - Criar preview visual do componente
function createComponentPreview(component) {
    if (!component.shapes || component.shapes.length === 0) {
        return `<div style="font-size: 1.2rem;">${component.icon}</div>`;
    }
    
    // Calcula os limites das formas para normalizar as posições
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    component.shapes.forEach(shape => {
        const x = shape.position ? shape.position.x : 0;
        const y = shape.position ? shape.position.y : 0;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + 60); // assumindo tamanho padrão de 60px
        maxY = Math.max(maxY, y + 60);
    });
    
    const width = maxX - minX || 60;
    const height = maxY - minY || 60;
    const scale = Math.min(50 / width, 40 / height); // escala para caber no preview
    
    return component.shapes.map(shape => {
        const x = shape.position ? (shape.position.x - minX) * scale : 0;
        const y = shape.position ? (shape.position.y - minY) * scale : 0;
        const size = 12 * scale;
        
        return `<div style="position: absolute; left: ${x}px; top: ${y}px; width: ${size}px; height: ${size}px;">
            ${createMiniShapeContent(shape, size)}
        </div>`;
    }).join('');
}

// NOVO - Criar conteúdo miniaturizado da forma
function createMiniShapeContent(shape, size) {
    const miniShapeMap = {
        'circle': `<div style="width: ${size}px; height: ${size}px; border-radius: 50%; background-color: ${shape.color}; border: 1px solid ${shape.color};"></div>`,
        'square': `<div style="width: ${size}px; height: ${size}px; background-color: ${shape.color}; border: 1px solid ${shape.color};"></div>`,
        'triangle': `<div style="width: 0; height: 0; border-left: ${size/2}px solid transparent; border-right: ${size/2}px solid transparent; border-bottom: ${size}px solid ${shape.color};"></div>`,
        'rectangle': `<div style="width: ${size * 1.5}px; height: ${size}px; background-color: ${shape.color}; border: 1px solid ${shape.color};"></div>`,
        'diamond': `<div style="width: ${size}px; height: ${size}px; background-color: ${shape.color}; transform: rotate(45deg); border: 1px solid ${shape.color};"></div>`,
        'star': `<div style="font-size: ${size}px; color: ${shape.color};">⭐</div>`,
        'line': `<div style="width: ${size}px; height: 2px; background-color: ${shape.color};"></div>`,
        'hexagon': `<div style="font-size: ${size}px; color: ${shape.color};">⬡</div>`
    };
    return miniShapeMap[shape.id] || `<div style="font-size: ${size}px; color: ${shape.color}">${shape.icon}</div>`;
}

// Tornar elemento arrastável dentro da área
function makeElementDraggable(element) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    element.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.type === 'color') return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(element.style.left);
        startTop = parseInt(element.style.top);
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        e.preventDefault();
    });
    
    function handleMouseMove(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const newLeft = startLeft + deltaX;
        const newTop = startTop + deltaY;
        
        const parent = element.parentElement;
        const maxLeft = parent.clientWidth - element.offsetWidth;
        const maxTop = parent.clientHeight - element.offsetHeight;
        
        element.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
        element.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
    }
    
    function handleMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // Atualizar preview após mover
        if (element.classList.contains('assembly-element')) {
            updateComponentPreview();
        } else if (element.classList.contains('assembly-component')) {
            updateGamePreview();
        }
    }
}

// CORRIGIDO - Remover forma da montagem
window.removeShape = function(uniqueId) {
    const element = document.querySelector(`[data-unique-id="${uniqueId}"]`);
    if (element) {
        element.remove();
        updateComponentPreview();
    }
};

// CORRIGIDO - Remover componente do jogo
window.removeGameComponent = function(uniqueId) {
    const element = document.querySelector(`[data-unique-id="${uniqueId}"]`);
    if (element) {
        element.remove();
        updateGamePreview();
    }
};

// Limpar área de montagem de componentes
function clearShapeAssembly() {
    document.getElementById('shapeAssemblyArea').innerHTML = '';
    updateComponentPreview();
}

// Limpar área de montagem de jogos
function clearGameAssembly() {
    document.getElementById('gameAssemblyArea').innerHTML = '';
    updateGamePreview();
}

// Atualizar preview do componente
function updateComponentPreview() {
    const assemblyArea = document.getElementById('shapeAssemblyArea');
    const preview = document.getElementById('componentPreview');
    const shapes = assemblyArea.querySelectorAll('.assembly-element');
    
    if (shapes.length === 0) {
        preview.innerHTML = '<p class="empty-state">Arraste formas para a área de montagem para criar um componente</p>';
        return;
    }
    
    const shapesList = Array.from(shapes).map(shape => {
        const shapeId = shape.dataset.shapeId;
        const shapeData = basicShapes.find(s => s.id === shapeId);
        return `<span class="shape-tag">${shapeData.icon} ${shapeData.name}</span>`;
    }).join('');
    
    preview.innerHTML = `
        <h4>Formas utilizadas:</h4>
        <div style="margin-top: 10px;">${shapesList}</div>
        <p style="margin-top: 15px; color: #6c757d; font-size: 0.9rem;">
            Total de peças: ${shapes.length}
        </p>
    `;
}

// Atualizar preview do jogo
function updateGamePreview() {
    const assemblyArea = document.getElementById('gameAssemblyArea');
    const preview = document.getElementById('gamePreview');
    const components = assemblyArea.querySelectorAll('.assembly-component');
    
    if (components.length === 0) {
        preview.innerHTML = '<p class="empty-state">Arraste componentes para a área de montagem para criar um jogo</p>';
        return;
    }
    
    const componentsList = Array.from(components).map(comp => {
        const compId = comp.dataset.componentId;
        const compData = currentComponents[compId];
        return `<span class="component-tag">${compData.icon} ${compData.name}</span>`;
    }).join('');
    
    preview.innerHTML = `
        <h4>Componentes utilizados:</h4>
        <div style="margin-top: 10px;">${componentsList}</div>
        <p style="margin-top: 15px; color: #6c757d; font-size: 0.9rem;">
            Total de componentes: ${components.length}
        </p>
    `;
}

// Mostrar formulário de componente
function showComponentForm() {
    const assemblyArea = document.getElementById('shapeAssemblyArea');
    const shapes = assemblyArea.querySelectorAll('.assembly-element');
    
    if (shapes.length === 0) {
        alert('Adicione pelo menos uma forma antes de salvar o componente!');
        return;
    }
    
    document.getElementById('componentForm').classList.remove('hidden');
}

// Mostrar formulário de jogo
function showGameForm() {
    const assemblyArea = document.getElementById('gameAssemblyArea');
    const components = assemblyArea.querySelectorAll('.assembly-component');
    
    if (components.length === 0) {
        alert('Adicione pelo menos um componente antes de salvar o jogo!');
        return;
    }
    
    document.getElementById('gameForm').classList.remove('hidden');
}

// CORRIGIDO - Salvar componente
function saveComponent() {
    const name = document.getElementById('componentName').value.trim();
    const icon = document.getElementById('componentIcon').value.trim() || '🔧';
    const category = document.getElementById('componentCategory').value;
    
    if (!name) {
        alert('Por favor, digite um nome para o componente!');
        return;
    }
    
    const assemblyArea = document.getElementById('shapeAssemblyArea');
    const shapes = Array.from(assemblyArea.querySelectorAll('.assembly-element')).map(shape => {
        const shapeId = shape.dataset.shapeId;
        const shapeData = basicShapes.find(s => s.id === shapeId);
        
        // Captura cor personalizada se existir
        const figure = shape.querySelector('.shape-figure');
        const customColor = figure && figure.style.backgroundColor ? 
            figure.style.backgroundColor : shapeData.color;
        
        return {
            ...shapeData,
            color: customColor,
            position: {
                x: parseInt(shape.style.left),
                y: parseInt(shape.style.top)
            },
            size: {
                width: parseInt(shape.style.width),
                height: parseInt(shape.style.height)
            },
            rotation: parseInt(shape.dataset.rotation || '0')
        };
    });
    
    if (shapes.length === 0) {
        alert('Adicione pelo menos uma forma antes de salvar o componente!');
        return;
    }

    const componentId = `comp-${Date.now()}`;
    const component = {
        id: componentId,
        name,
        icon,
        category,
        shapes,
        createdAt: new Date().toISOString()
    };
    
    currentComponents[componentId] = component;
    saveToStorage();
    displayComponents();
    updateComponentsSelection();
    
    // Limpar formulário e fechar
    document.getElementById('componentName').value = '';
    document.getElementById('componentIcon').value = '';
    document.getElementById('componentForm').classList.add('hidden');
    clearShapeAssembly();
    
    alert('Componente salvo com sucesso!');
}

// Salvar jogo
function saveGame() {
    const name = document.getElementById('gameName').value.trim();
    const description = document.getElementById('gameDescription').value.trim();
    
    if (!name) {
        alert('Por favor, digite um nome para o jogo!');
        return;
    }
    
    const assemblyArea = document.getElementById('gameAssemblyArea');
    const components = Array.from(assemblyArea.querySelectorAll('.assembly-component')).map(comp => {
        const compId = comp.dataset.componentId;
        const compData = currentComponents[compId];
        return {
            ...compData,
            position: {
                x: parseInt(comp.style.left),
                y: parseInt(comp.style.top)
            }
        };
    });
    
    const gameId = `game-${Date.now()}`;
    const game = {
        id: gameId,
        name,
        description,
        components,
        createdAt: new Date().toISOString()
    };
    
    currentGames[gameId] = game;
    saveToStorage();
    displayGames();
    
    // Limpar formulário e fechar
    document.getElementById('gameName').value = '';
    document.getElementById('gameDescription').value = '';
    document.getElementById('gameForm').classList.add('hidden');
    clearGameAssembly();
    
    alert('Jogo salvo com sucesso!');
}

// Exibir componentes na biblioteca
function displayComponents() {
    const grid = document.getElementById('componentsGrid');
    const components = Object.values(currentComponents);
    
    if (components.length === 0) {
        grid.innerHTML = '<p class="empty-state">Seus componentes criados aparecerão aqui</p>';
        return;
    }
    
    grid.innerHTML = components.map(comp => `
        <div class="component-card">
            <div class="component-header">
                <span class="component-icon">${comp.icon}</span>
                <span class="component-name">${comp.name}</span>
            </div>
            <div class="component-category">${comp.category}</div>
            <div class="component-shapes">
                <strong>Formas:</strong> ${comp.shapes.map(s => `${s.icon} ${s.name}`).join(', ')}
            </div>
            <div class="controls">
                <button onclick="deleteComponent('${comp.id}')" class="button button-danger" style="padding: 0.5rem 1rem; font-size: 0.8rem;">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

// Exibir jogos na biblioteca
function displayGames() {
    const grid = document.getElementById('gamesGrid');
    const games = Object.values(currentGames);
    
    if (games.length === 0) {
        grid.innerHTML = '<p class="empty-state">Seus jogos criados aparecerão aqui</p>';
        return;
    }
    
    grid.innerHTML = games.map(game => `
        <div class="game-card">
            <div class="game-title">${game.name}</div>
            <div class="game-description">${game.description || 'Sem descrição'}</div>
            <div class="game-components">
                <h4>Componentes:</h4>
                <div class="components-chips">
                    ${game.components.map(comp => `
                        <span class="component-chip">${comp.icon} ${comp.name}</span>
                    `).join('')}
                </div>
            </div>
            <div class="game-actions">
                <button onclick="deleteGame('${game.id}')" class="button button-danger" style="padding: 0.5rem 1rem; font-size: 0.8rem;">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

// CORRIGIDO - Atualizar seleção de componentes na aba de jogos
function updateComponentsSelection() {
    const selection = document.getElementById('componentsSelection');
    const components = Object.values(currentComponents);
    
    if (components.length === 0) {
        selection.innerHTML = '<p class="empty-state">Crie componentes primeiro para montar jogos</p>';
        return;
    }
    
    selection.innerHTML = components.map(comp => `
        <div class="component-item" draggable="true" data-component-id="${comp.id}">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">${comp.icon}</div>
            <div style="font-size: 0.8rem; font-weight: 600;">${comp.name}</div>
            <div style="font-size: 0.7rem; color: #6c757d;">${comp.category}</div>
        </div>
    `).join('');
    
    // CORRIGIDO - Adicionar event listeners para drag com referência direta
    const componentItems = selection.querySelectorAll('.component-item');
    componentItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            const componentId = e.target.dataset.componentId;
            const component = currentComponents[componentId];
            
            if (component) {
                draggedElement = {
                    type: 'component',
                    data: component
                };
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', '');
            }
        });
        
        item.addEventListener('dragend', (e) => {
            draggedElement = null;
        });
    });
}

// Excluir componente
function deleteComponent(componentId) {
    if (confirm('Tem certeza que deseja excluir este componente?')) {
        delete currentComponents[componentId];
        saveToStorage();
        displayComponents();
        updateComponentsSelection();
    }
}

// Excluir jogo
function deleteGame(gameId) {
    if (confirm('Tem certeza que deseja excluir este jogo?')) {
        delete currentGames[gameId];
        saveToStorage();
        displayGames();
    }
}

// Salvar dados no armazenamento (usando variáveis em memória para Claude.ai)
function saveToStorage() {
    console.log('Dados salvos em memória:', {
        components: Object.keys(currentComponents).length,
        games: Object.keys(currentGames).length
    });
}

// Carregar dados salvos
function loadSavedData() {
    displayComponents();
    displayGames();
}

// Cria o conteúdo visual da forma
function createShapeContent(shape) {
    const shapeMap = {
        'circle': '<div class="shape-figure circle-fig"></div>',
        'square': '<div class="shape-figure square-fig"></div>',
        'triangle': '<div class="shape-figure triangle-fig"></div>',
        'rectangle': '<div class="shape-figure rectangle-fig"></div>',
        'diamond': '<div class="shape-figure diamond-fig"></div>',
        'star': '<div class="shape-figure star-fig"></div>',
        'line': '<div class="shape-figure line-fig"></div>',
        'hexagon': '<div class="shape-figure hexagon-fig"></div>'
    };
    return shapeMap[shape.id] || `<div class="shape-figure" style="color: ${shape.color}">${shape.icon}</div>`;
}

// Selecionar elemento
function selectElement(element) {
    document.querySelectorAll('.assembly-element.selected').forEach(el => {
        el.classList.remove('selected');
    });
    element.classList.add('selected');
}

// Tornar elemento redimensionável
function makeElementResizable(element) {
    const resizeHandle = element.querySelector('.resize-handle');

    resizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = element.offsetWidth;
        const startHeight = element.offsetHeight;

        function handleResize(e) {
            const newWidth = startWidth + (e.clientX - startX);
            const newHeight = startHeight + (e.clientY - startY);

            const minSize = 20;
            const maxSize = 200;

            const finalWidth = Math.max(minSize, Math.min(maxSize, newWidth));
            const finalHeight = Math.max(minSize, Math.min(maxSize, newHeight));

            element.style.width = `${finalWidth}px`;
            element.style.height = `${finalHeight}px`;

            const figure = element.querySelector('.shape-figure');
            if (figure) {
                figure.style.width = '100%';
                figure.style.height = '100%';
            }
        }

        function stopResize() {
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
            updateComponentPreview();
        }

        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
    });
}

// CORRIGIDO - Rodar a forma
function rotateShape(uniqueId) {
    const element = document.querySelector(`[data-unique-id="${uniqueId}"]`);
    if (!element) return;

    const figure = element.querySelector('.shape-figure');
    const currentRotation = parseInt(element.dataset.rotation || '0');
    const newRotation = (currentRotation + 45) % 360;

    element.dataset.rotation = newRotation;
    figure.style.transform = `rotate(${newRotation}deg)`;

    updateComponentPreview();
}

// CORRIGIDO - Mudar a cor da forma
function changeShapeColor(uniqueId, color) {
    const element = document.querySelector(`[data-unique-id="${uniqueId}"]`);
    if (!element) return;

    const figure = element.querySelector('.shape-figure');
    figure.style.backgroundColor = color;
    figure.style.borderColor = color;

    // Esconder o seletor de cor após a mudança
    const colorPicker = document.getElementById(`colorPicker-${uniqueId}`);
    if (colorPicker) {
        colorPicker.classList.add('hidden');
    }

    updateComponentPreview();
}

// CORRIGIDO - Alternar o seletor de cor com posicionamento correto
function toggleColorPicker(uniqueId) {
    const colorPicker = document.getElementById(`colorPicker-${uniqueId}`);
    const colorButton = document.querySelector(`[data-unique-id="${uniqueId}"] .color-btn`);
    
    if (!colorPicker || !colorButton) return;

    if (colorPicker.classList.contains('hidden')) {
        // Esconder todos os outros seletores de cor primeiro
        document.querySelectorAll('.color-picker').forEach(picker => {
            picker.classList.add('hidden');
        });
        
        // Posicionar o seletor de cor próximo ao botão
        const buttonRect = colorButton.getBoundingClientRect();
        const element = colorButton.closest('.assembly-element');
        const elementRect = element.getBoundingClientRect();
        
        // Calcular posição relativa ao elemento pai
        const relativeX = buttonRect.left - elementRect.left;
        const relativeY = buttonRect.bottom - elementRect.top + 5; // 5px abaixo do botão
        
        colorPicker.style.position = 'absolute';
        colorPicker.style.left = `${relativeX}px`;
        colorPicker.style.top = `${relativeY}px`;
        colorPicker.style.zIndex = '1000';
        
        // Mostrar o seletor atual
        colorPicker.classList.remove('hidden');
        
        // Pequeno delay para garantir que o elemento esteja visível antes de abrir
        setTimeout(() => {
            colorPicker.click();
        }, 10);
    } else {
        colorPicker.classList.add('hidden');
    }
}

// Desselecionar ao clicar na área de montagem
document.addEventListener('DOMContentLoaded', function() {
    const shapeAssemblyArea = document.getElementById('shapeAssemblyArea');
    if (shapeAssemblyArea) {
        shapeAssemblyArea.addEventListener('click', (e) => {
            if (e.target === shapeAssemblyArea) {
                document.querySelectorAll('.assembly-element.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                // Esconder todos os seletores de cor
                document.querySelectorAll('.color-picker').forEach(picker => {
                    picker.classList.add('hidden');
                });
            }
        });
    }
});

// NOVO - Função para garantir que os componentes sejam atualizados quando mudamos de aba
window.addEventListener('DOMContentLoaded', function() {
    // Observer para detectar mudanças nas abas e atualizar componentes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const gameTab = document.getElementById('game-creator');
                if (gameTab && gameTab.classList.contains('active')) {
                    // Pequeno delay para garantir que a aba esteja totalmente carregada
                    setTimeout(() => {
                        updateComponentsSelection();
                    }, 100);
                }
            }
        });
    });
    
    const gameTab = document.getElementById('game-creator');
    if (gameTab) {
        observer.observe(gameTab, { attributes: true, attributeFilter: ['class'] });
    }
});

// NOVO - Função para atualizar componentes quando a aba de jogos é ativada
function refreshComponentsForGame() {
    updateComponentsSelection();
}