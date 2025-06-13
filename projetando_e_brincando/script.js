let currentComponents = {};
let currentGames = {};
let draggedElement = null;
let dragOffset = { x: 0, y: 0 };

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

document.addEventListener('DOMContentLoaded', function () {
    initializeTabs();
    createShapesGrid();
    loadSavedData();
    setupEventListeners();
});

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');

            if (targetTab === 'game-creator') {
                updateComponentsSelection();
            }
        });
    });
}

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

        shapeElement.addEventListener('dragstart', handleShapeDragStart);
        shapeElement.addEventListener('dragend', handleDragEnd);

        shapesGrid.appendChild(shapeElement);
    });
}

function setupEventListeners() {
    const shapeAssemblyArea = document.getElementById('shapeAssemblyArea');
    shapeAssemblyArea.addEventListener('dragover', handleDragOver);
    shapeAssemblyArea.addEventListener('drop', handleShapeDrop);
    shapeAssemblyArea.addEventListener('dragleave', handleDragLeave);

    const gameAssemblyArea = document.getElementById('gameAssemblyArea');
    gameAssemblyArea.addEventListener('dragover', handleDragOver);
    gameAssemblyArea.addEventListener('drop', handleGameDrop);
    gameAssemblyArea.addEventListener('dragleave', handleDragLeave);

    document.getElementById('clearShapeAssembly').addEventListener('click', clearShapeAssembly);
    document.getElementById('saveComponent').addEventListener('click', showComponentForm);
    document.getElementById('clearGameAssembly').addEventListener('click', clearGameAssembly);
    document.getElementById('saveGame').addEventListener('click', showGameForm);

    document.getElementById('confirmComponent').addEventListener('click', saveComponent);
    document.getElementById('confirmGame').addEventListener('click', saveGame);
}

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
    e.dataTransfer.setData('text/plain', ''); 
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
    const x = e.clientX - rect.left - 30; 
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

function createComponentPreview(component) {
    if (!component.shapes || component.shapes.length === 0) {
        return `<div style="font-size: 1.2rem;">${component.icon}</div>`;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    component.shapes.forEach(shape => {
        const x = shape.position ? shape.position.x : 0;
        const y = shape.position ? shape.position.y : 0;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + 60); 
        maxY = Math.max(maxY, y + 60);
    });

    const width = maxX - minX || 60;
    const height = maxY - minY || 60;
    const scale = Math.min(50 / width, 40 / height); 

    return component.shapes.map(shape => {
        const x = shape.position ? (shape.position.x - minX) * scale : 0;
        const y = shape.position ? (shape.position.y - minY) * scale : 0;
        const size = 12 * scale;

        return `<div style="position: absolute; left: ${x}px; top: ${y}px; width: ${size}px; height: ${size}px;">
            ${createMiniShapeContent(shape, size)}
        </div>`;
    }).join('');
}

function createMiniShapeContent(shape, size) {
    const miniShapeMap = {
        'circle': `<div style="width: ${size}px; height: ${size}px; border-radius: 50%; background-color: ${shape.color}; border: 1px solid ${shape.color};"></div>`,
        'square': `<div style="width: ${size}px; height: ${size}px; background-color: ${shape.color}; border: 1px solid ${shape.color};"></div>`,
        'triangle': `<div style="width: 0; height: 0; border-left: ${size / 2}px solid transparent; border-right: ${size / 2}px solid transparent; border-bottom: ${size}px solid ${shape.color};"></div>`,
        'rectangle': `<div style="width: ${size * 1.5}px; height: ${size}px; background-color: ${shape.color}; border: 1px solid ${shape.color};"></div>`,
        'diamond': `<div style="width: ${size}px; height: ${size}px; background-color: ${shape.color}; transform: rotate(45deg); border: 1px solid ${shape.color};"></div>`,
        'star': `<div style="font-size: ${size}px; color: ${shape.color};">⭐</div>`,
        'line': `<div style="width: ${size}px; height: 2px; background-color: ${shape.color};"></div>`,
        'hexagon': `<div style="font-size: ${size}px; color: ${shape.color};">⬡</div>`
    };
    return miniShapeMap[shape.id] || `<div style="font-size: ${size}px; color: ${shape.color}">${shape.icon}</div>`;
}

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

        if (element.classList.contains('assembly-element')) {
            updateComponentPreview();
        } else if (element.classList.contains('assembly-component')) {
            updateGamePreview();
        }
    }
}

window.removeShape = function (uniqueId) {
    const element = document.querySelector(`[data-unique-id="${uniqueId}"]`);
    if (element) {
        element.remove();
        updateComponentPreview();
    }
};

window.removeGameComponent = function (uniqueId) {
    const element = document.querySelector(`[data-unique-id="${uniqueId}"]`);
    if (element) {
        element.remove();
        updateGamePreview();
    }
};

function clearShapeAssembly() {
    document.getElementById('shapeAssemblyArea').innerHTML = '';
    updateComponentPreview();
}

function clearGameAssembly() {
    document.getElementById('gameAssemblyArea').innerHTML = '';
    updateGamePreview();
}

function updateComponentPreview() {
    const assemblyArea = document.getElementById('shapeAssemblyArea');
    const preview = document.getElementById('componentPreview');
    const shapes = assemblyArea.querySelectorAll('.assembly-element');

    if (shapes.length === 0) {
        preview.innerHTML = '<p class="empty-message">Arraste formas para a área de montagem para criar um componente</p>';
        return;
    }

    const shapeCounts = {};
    shapes.forEach(shape => {
        const shapeId = shape.dataset.shapeId;
        const shapeData = basicShapes.find(s => s.id === shapeId);
        if (shapeData) {
            shapeCounts[shapeData.name] = (shapeCounts[shapeData.name] || 0) + 1;
        }
    });

    const shapesList = Object.entries(shapeCounts).map(([name, count]) => {
        const shapeData = basicShapes.find(s => s.name === name);
        return `<div class="shape-count-item">
            <span class="shape-icon" style="color: ${shapeData.color}">${shapeData.icon}</span>
            <span class="shape-name">${name}</span>
            <span class="shape-count">${count}x</span>
        </div>`;
    }).join('');

    preview.innerHTML = `
        <h4>Pré-visualização do Componente</h4>
        <div class="total-shapes">
            <span class="total-number">${shapes.length}</span>
            <span class="total-label">peças no total</span>
        </div>
        <div class="shapes-list">
            ${shapesList}
        </div>
    `;
}

function updateGamePreview() {
    const assemblyArea = document.getElementById('gameAssemblyArea');
    const preview = document.getElementById('gamePreview');
    const components = assemblyArea.querySelectorAll('.assembly-component');

    if (components.length === 0) {
        preview.innerHTML = '<p class="empty-message">Arraste componentes para a área de montagem para criar um jogo</p>';
        return;
    }

    const componentCounts = {};
    let totalShapes = 0;
    
    components.forEach(comp => {
        const compId = comp.dataset.componentId;
        const compData = currentComponents[compId];
        if (compData) {
            componentCounts[compData.name] = (componentCounts[compData.name] || 0) + 1;
            totalShapes += compData.shapes ? compData.shapes.length : 0;
        }
    });

    const componentsList = Object.entries(componentCounts).map(([name, count]) => {
        const compData = Object.values(currentComponents).find(c => c.name === name);
        return `<div class="component-count-item">
            <span class="component-icon">${compData.icon || '🔧'}</span>
            <span class="component-name">${compData.name}</span>
            <span class="component-count">${count}x</span>
        </div>`;
    }).join('');

    preview.innerHTML = `
        <h4>Pré-visualização do Jogo</h4>
        <div class="total-shapes">
            <span class="total-number">${totalShapes}</span>
            <span class="total-label">peças no total</span>
        </div>
        <div class="components-list">
            ${componentsList}
        </div>
    `;
}

function showComponentForm() {
    const assemblyArea = document.getElementById('shapeAssemblyArea');
    const shapes = assemblyArea.querySelectorAll('.assembly-element');

    if (shapes.length === 0) {
        showAlert('Adicione pelo menos uma forma antes de salvar o componente!');
        return;
    }

    document.getElementById('componentForm').classList.remove('hidden');
}

function showGameForm() {
    const assemblyArea = document.getElementById('gameAssemblyArea');
    const components = assemblyArea.querySelectorAll('.assembly-component');

    if (components.length === 0) {
        showAlert('Adicione pelo menos um componente antes de salvar o jogo!');
        return;
    }

    document.getElementById('gameForm').classList.remove('hidden');
}

function saveComponent() {
    const name = document.getElementById('componentName').value.trim();

    if (!name) {
        showAlert('Por favor, digite um nome para o componente!');
        return;
    }

    const assemblyArea = document.getElementById('shapeAssemblyArea');
    const shapes = Array.from(assemblyArea.querySelectorAll('.assembly-element')).map(shape => {
        const shapeId = shape.dataset.shapeId;
        const shapeData = basicShapes.find(s => s.id === shapeId);

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
        showAlert('Adicione pelo menos uma forma antes de salvar o componente!');
        return;
    }

    const componentId = `comp-${Date.now()}`;
    const component = {
        id: componentId,
        name,
        icon: '🔧', 
        category: 'Peça Básica', 
        shapes,
        createdAt: new Date().toISOString()
    };

    currentComponents[componentId] = component;
    saveToStorage();
    displayComponents();
    updateComponentsSelection();

    document.getElementById('componentName').value = '';
    document.getElementById('componentForm').classList.add('hidden');
    clearShapeAssembly();

    showAlert('Componente salvo com sucesso!');
}

function saveGame() {
    const name = document.getElementById('gameName').value.trim();

    if (!name) {
        showAlert('Por favor, digite um nome para o jogo!');
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
        description: '', 
        components,
        createdAt: new Date().toISOString()
    };

    currentGames[gameId] = game;
    saveToStorage();
    displayGames();

    document.getElementById('gameName').value = '';
    document.getElementById('gameForm').classList.add('hidden');
    clearGameAssembly();

    showAlert('Jogo salvo com sucesso!');
}

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
                <button onclick="exportGameToDXF('${game.id}')" class="button button-success" style="padding: 0.5rem 1rem; font-size: 0.8rem;">📐 Exportar DXF</button>
                <button onclick="deleteGame('${game.id}')" class="button button-danger" style="padding: 0.5rem 1rem; font-size: 0.8rem;">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

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

function deleteComponent(componentId) {
    showConfirm('Tem certeza que deseja excluir este componente?', (confirmed) => {
        if (confirmed) {
            delete currentComponents[componentId];
            saveToStorage();
            displayComponents();
            updateComponentsSelection();
        }
    });
}

function deleteGame(gameId) {
    showConfirm('Tem certeza que deseja excluir este jogo?', (confirmed) => {
        if (confirmed) {
            delete currentGames[gameId];
            saveToStorage();
            displayGames();
        }
    });
}

function saveToStorage() {
    console.log('Dados salvos em memória:', {
        components: Object.keys(currentComponents).length,
        games: Object.keys(currentGames).length
    });
}

function loadSavedData() {
    displayComponents();
    displayGames();
}

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

function selectElement(element) {
    document.querySelectorAll('.assembly-element.selected').forEach(el => {
        el.classList.remove('selected');
    });
    element.classList.add('selected');
}

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

function changeShapeColor(uniqueId, color) {
    const element = document.querySelector(`[data-unique-id="${uniqueId}"]`);
    if (!element) return;

    const figure = element.querySelector('.shape-figure');
    figure.style.backgroundColor = color;
    figure.style.borderColor = color;

    const colorPicker = document.getElementById(`colorPicker-${uniqueId}`);
    if (colorPicker) {
        colorPicker.classList.add('hidden');
    }

    updateComponentPreview();
}

function toggleColorPicker(uniqueId) {
    const colorPicker = document.getElementById(`colorPicker-${uniqueId}`);
    const colorButton = document.querySelector(`[data-unique-id="${uniqueId}"] .color-btn`);

    if (!colorPicker || !colorButton) return;

    if (colorPicker.classList.contains('hidden')) {
        document.querySelectorAll('.color-picker').forEach(picker => {
            picker.classList.add('hidden');
        });

        const buttonRect = colorButton.getBoundingClientRect();
        const element = colorButton.closest('.assembly-element');
        const elementRect = element.getBoundingClientRect();

        const relativeX = buttonRect.left - elementRect.left;
        const relativeY = buttonRect.bottom - elementRect.top + 5; 

        colorPicker.style.position = 'absolute';
        colorPicker.style.left = `${relativeX}px`;
        colorPicker.style.top = `${relativeY}px`;
        colorPicker.style.zIndex = '1000';

        colorPicker.classList.remove('hidden');

        setTimeout(() => {
            colorPicker.click();
        }, 10);
    } else {
        colorPicker.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const shapeAssemblyArea = document.getElementById('shapeAssemblyArea');
    if (shapeAssemblyArea) {
        shapeAssemblyArea.addEventListener('click', (e) => {
            if (e.target === shapeAssemblyArea) {
                document.querySelectorAll('.assembly-element.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                document.querySelectorAll('.color-picker').forEach(picker => {
                    picker.classList.add('hidden');
                });
            }
        });
    }
});

window.addEventListener('DOMContentLoaded', function () {
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const gameTab = document.getElementById('game-creator');
                if (gameTab && gameTab.classList.contains('active')) {
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

function refreshComponentsForGame() {
    updateComponentsSelection();
}


function showAlert(message) {
    const modal = document.getElementById('alertModal');
    const messageElement = document.getElementById('alertMessage');
    
    messageElement.textContent = message;
    modal.classList.add('active');
    
    document.getElementById('alertOk').onclick = function() {
        modal.classList.remove('active');
    };
}

function showConfirm(message, callback) {
    const modal = document.getElementById('confirmModal');
    const messageElement = document.getElementById('confirmMessage');
    
    messageElement.textContent = message;
    modal.classList.add('active');
    
    document.getElementById('confirmYes').onclick = function() {
        modal.classList.remove('active');
        callback(true);
    };
    
    document.getElementById('confirmNo').onclick = function() {
        modal.classList.remove('active');
        callback(false);
    };
}

function exportGameToDXF(gameId) {
    const game = currentGames[gameId];
    if (!game) {
        showAlert('Jogo não encontrado!');
        return;
    }

    const validation = validateGameForDXF(game);
    if (!validation.valid) {
        showAlert(validation.message);
        return;
    }

    let dxfContent = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSUNITS
70
4
9
$MEASUREMENT
70
1
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
2
0
LAYER
2
0
70
0
62
7
6
CONTINUOUS
0
LAYER
2
SHAPES
70
0
62
1
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

    let entityCount = 0;

    game.components.forEach((component, compIndex) => {
        if (component.shapes && component.shapes.length > 0) {
            component.shapes.forEach((shape, shapeIndex) => {
                const compX = parseFloat(component.position?.x) || 0;
                const compY = parseFloat(component.position?.y) || 0;
                const shapeX = parseFloat(shape.position?.x) || 0;
                const shapeY = parseFloat(shape.position?.y) || 0;

                const x = compX + shapeX;
                const y = compY + shapeY;

                const width = parseFloat(shape.size?.width) || 60;
                const height = parseFloat(shape.size?.height) || 60;

                const rotation = parseFloat(shape.rotation) || 0;

                const scale = 25.4 / 96; 
                const scaledX = x * scale;
                const scaledY = y * scale;
                const scaledWidth = width * scale;
                const scaledHeight = height * scale;

                switch (shape.id) {
                    case 'circle':
                        dxfContent += `0
CIRCLE
8
SHAPES
10
${(scaledX + scaledWidth / 2).toFixed(3)}
20
${(scaledY + scaledHeight / 2).toFixed(3)}
40
${(Math.min(scaledWidth, scaledHeight) / 2).toFixed(3)}
`;
                        entityCount++;
                        break;

                    case 'square':
                    case 'rectangle':
                        const rectPoints = [
                            [scaledX, scaledY],
                            [scaledX + scaledWidth, scaledY],
                            [scaledX + scaledWidth, scaledY + scaledHeight],
                            [scaledX, scaledY + scaledHeight]
                        ];

                        const rotatedRectPoints = rotation !== 0 ?
                            rotatePoints(rectPoints, scaledX + scaledWidth / 2, scaledY + scaledHeight / 2, rotation) :
                            rectPoints;

                        dxfContent += `0
LWPOLYLINE
8
SHAPES
90
4
70
1
`;
                        rotatedRectPoints.forEach(point => {
                            dxfContent += `10
${point[0].toFixed(3)}
20
${point[1].toFixed(3)}
`;
                        });
                        entityCount++;
                        break;

                    case 'triangle':
                        const triPoints = [
                            [scaledX + scaledWidth / 2, scaledY], 
                            [scaledX + scaledWidth, scaledY + scaledHeight], 
                            [scaledX, scaledY + scaledHeight] 
                        ];

                        const rotatedTriPoints = rotation !== 0 ?
                            rotatePoints(triPoints, scaledX + scaledWidth / 2, scaledY + scaledHeight / 2, rotation) :
                            triPoints;

                        dxfContent += `0
LWPOLYLINE
8
SHAPES
90
3
70
1
`;
                        rotatedTriPoints.forEach(point => {
                            dxfContent += `10
${point[0].toFixed(3)}
20
${point[1].toFixed(3)}
`;
                        });
                        entityCount++;
                        break;

                    case 'line':
                        let lineStart = [scaledX, scaledY + scaledHeight / 2];
                        let lineEnd = [scaledX + scaledWidth, scaledY + scaledHeight / 2];

                        if (rotation !== 0) {
                            const center = [scaledX + scaledWidth / 2, scaledY + scaledHeight / 2];
                            lineStart = rotatePoint(lineStart[0], lineStart[1], center[0], center[1], rotation);
                            lineEnd = rotatePoint(lineEnd[0], lineEnd[1], center[0], center[1], rotation);
                        }

                        dxfContent += `0
LINE
8
SHAPES
10
${lineStart[0].toFixed(3)}
20
${lineStart[1].toFixed(3)}
11
${lineEnd[0].toFixed(3)}
21
${lineEnd[1].toFixed(3)}
`;
                        entityCount++;
                        break;

                    case 'diamond':
                        const diamondPoints = [
                            [scaledX + scaledWidth / 2, scaledY], 
                            [scaledX + scaledWidth, scaledY + scaledHeight / 2], 
                            [scaledX + scaledWidth / 2, scaledY + scaledHeight], 
                            [scaledX, scaledY + scaledHeight / 2] 
                        ];

                        const rotatedDiamondPoints = rotation !== 0 ?
                            rotatePoints(diamondPoints, scaledX + scaledWidth / 2, scaledY + scaledHeight / 2, rotation) :
                            diamondPoints;

                        dxfContent += `0
LWPOLYLINE
8
SHAPES
90
4
70
1
`;
                        rotatedDiamondPoints.forEach(point => {
                            dxfContent += `10
${point[0].toFixed(3)}
20
${point[1].toFixed(3)}
`;
                        });
                        entityCount++;
                        break;

                    case 'hexagon':
                        const cx = scaledX + scaledWidth / 2;
                        const cy = scaledY + scaledHeight / 2;
                        const r = Math.min(scaledWidth, scaledHeight) / 2;

                        const hexPoints = [];
                        for (let i = 0; i < 6; i++) {
                            const angle = (i * 60 + rotation) * Math.PI / 180;
                            hexPoints.push([
                                cx + r * Math.cos(angle),
                                cy + r * Math.sin(angle)
                            ]);
                        }

                        dxfContent += `0
LWPOLYLINE
8
SHAPES
90
6
70
1
`;
                        hexPoints.forEach(point => {
                            dxfContent += `10
${point[0].toFixed(3)}
20
${point[1].toFixed(3)}
`;
                        });
                        entityCount++;
                        break;

                    case 'star':
                        const starCx = scaledX + scaledWidth / 2;
                        const starCy = scaledY + scaledHeight / 2;
                        const outerR = Math.min(scaledWidth, scaledHeight) / 2;
                        const innerR = outerR * 0.4; 

                        const starPoints = [];
                        for (let i = 0; i < 10; i++) {
                            const angle = (i * 36 + rotation) * Math.PI / 180;
                            const radius = i % 2 === 0 ? outerR : innerR;
                            starPoints.push([
                                starCx + radius * Math.cos(angle),
                                starCy + radius * Math.sin(angle)
                            ]);
                        }

                        dxfContent += `0
LWPOLYLINE
8
SHAPES
90
10
70
1
`;
                        starPoints.forEach(point => {
                            dxfContent += `10
${point[0].toFixed(3)}
20
${point[1].toFixed(3)}
`;
                        });
                        entityCount++;
                        break;

                    default:
                        dxfContent += `0
CIRCLE
8
SHAPES
10
${(scaledX + scaledWidth / 2).toFixed(3)}
20
${(scaledY + scaledHeight / 2).toFixed(3)}
40
${(Math.min(scaledWidth, scaledHeight) / 2).toFixed(3)}
`;
                        entityCount++;
                        break;
                }
            });
        }
    });

    dxfContent += `0
ENDSEC
0
EOF`;

    if (entityCount === 0) {
        showAlert('Nenhuma forma válida encontrada para exportar!');
        return;
    }

    try {
        const blob = new Blob([dxfContent], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${game.name.replace(/[^a-zA-Z0-9\-_]/g, '_')}.dxf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showAlert(`Arquivo DXF exportado com sucesso!\n\nJogo: ${game.name}\nFormas exportadas: ${entityCount}\nUnidades: milímetros`);
    } catch (error) {
        console.error('Erro ao exportar DXF:', error);
        showAlert('Erro ao exportar arquivo DXF. Verifique o console para mais detalhes.');
    }
}

function rotatePoint(x, y, centerX, centerY, angle) {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const dx = x - centerX;
    const dy = y - centerY;

    return [
        centerX + dx * cos - dy * sin,
        centerY + dx * sin + dy * cos
    ];
}

function rotatePoints(points, centerX, centerY, angle) {
    return points.map(point => rotatePoint(point[0], point[1], centerX, centerY, angle));
}

function validateGameForDXF(game) {
    if (!game.components || game.components.length === 0) {
        return { valid: false, message: 'O jogo não possui componentes para exportar.' };
    }

    let totalShapes = 0;
    for (const component of game.components) {
        if (component.shapes && component.shapes.length > 0) {
            totalShapes += component.shapes.length;
        }
    }

    if (totalShapes === 0) {
        return { valid: false, message: 'O jogo não possui formas válidas para exportar.' };
    }

    return { valid: true, totalShapes };
}
