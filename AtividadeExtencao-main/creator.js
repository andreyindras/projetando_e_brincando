class ToyCreator {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.selectedElement = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.elementCounter = 0;
        this.currentColor = 'linear-gradient(135deg, #667eea, #764ba2)';
        this.currentSize = 1;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Drag and drop from sidebar
        const elements = document.querySelectorAll('.element[draggable="true"]');
        elements.forEach(element => {
            element.addEventListener('dragstart', this.handleDragStart.bind(this));
        });

        this.canvas.addEventListener('dragover', this.handleDragOver.bind(this));
        this.canvas.addEventListener('drop', this.handleDrop.bind(this));
        this.canvas.addEventListener('dragleave', this.handleDragLeave.bind(this));

        // Color palette
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', this.handleColorSelect.bind(this));
        });

        // Size slider
        document.getElementById('sizeSlider').addEventListener('input', this.handleSizeChange.bind(this));

        // Control buttons
        document.getElementById('deleteBtn').addEventListener('click', this.deleteSelected.bind(this));
        document.getElementById('duplicateBtn').addEventListener('click', this.duplicateSelected.bind(this));
        document.getElementById('saveBtn').addEventListener('click', this.saveToy.bind(this));
        document.getElementById('clearBtn').addEventListener('click', this.clearCanvas.bind(this));
        document.getElementById('backBtn').addEventListener('click', () => window.history.back());

        // Canvas click to deselect
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));

        // Global mouse events
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.currentTarget.dataset.shape);
    }

    handleDragOver(e) {
        e.preventDefault();
        this.canvas.classList.add('drag-over');
    }

    handleDragLeave(e) {
        if (!this.canvas.contains(e.relatedTarget)) {
            this.canvas.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        this.canvas.classList.remove('drag-over');
        
        const shapeType = e.dataTransfer.getData('text/plain');
        if (!shapeType) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.createElement(shapeType, x, y);
    }

    createElement(shapeType, x, y) {
        const element = document.createElement('div');
        element.className = `placed-element ${shapeType}`;
        element.style.left = x + 'px';
        element.style.top = y + 'px';
        element.style.transform = `scale(${this.currentSize})`;
        element.dataset.id = ++this.elementCounter;

        // Create the shape
        const shape = document.createElement('div');
        shape.className = `shape ${shapeType}`;
        shape.style.background = this.currentColor;

        // Special handling for triangle shape
        if (shapeType === 'triangle') {
            shape.style.borderBottomColor = this.currentColor.includes('gradient') ? '#4ecdc4' : this.currentColor;
        }

        // Add resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';

        element.appendChild(shape);
        element.appendChild(resizeHandle);

        // Event listeners for the placed element
        element.addEventListener('mousedown', this.handleElementMouseDown.bind(this));
        resizeHandle.addEventListener('mousedown', this.handleResizeStart.bind(this));

        this.canvas.appendChild(element);
        this.canvas.classList.add('has-elements');
        
        this.selectElement(element);
    }

    handleElementMouseDown(e) {
        if (e.target.classList.contains('resize-handle')) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        this.selectElement(e.currentTarget);
        this.isDragging = true;
        
        const rect = e.currentTarget.getBoundingClientRect();
        this.dragStartX = e.clientX - rect.left;
        this.dragStartY = e.clientY - rect.top;
    }

    handleResizeStart(e) {
        e.preventDefault();
        e.stopPropagation();
        this.isResizing = true;
        this.selectedElement = e.target.parentElement;
    }

    handleMouseMove(e) {
        if (this.isDragging && this.selectedElement) {
            const canvasRect = this.canvas.getBoundingClientRect();
            let x = e.clientX - canvasRect.left - this.dragStartX;
            let y = e.clientY - canvasRect.top - this.dragStartY;
            
            // Keep element within canvas bounds
            x = Math.max(0, Math.min(x, this.canvas.offsetWidth - this.selectedElement.offsetWidth));
            y = Math.max(0, Math.min(y, this.canvas.offsetHeight - this.selectedElement.offsetHeight));
            
            this.selectedElement.style.left = x + 'px';
            this.selectedElement.style.top = y + 'px';
        } else if (this.isResizing && this.selectedElement) {
            const startSize = parseFloat(this.selectedElement.style.transform.match(/scale\(([\d.]+)\)/)?.[1] || 1);
            const newSize = Math.max(0.3, Math.min(4, startSize + (e.movementX + e.movementY) * 0.01));
            this.selectedElement.style.transform = `scale(${newSize})`;
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.isResizing = false;
    }

    handleCanvasClick(e) {
        if (e.target === this.canvas) {
            this.deselectElement();
        }
    }

    selectElement(element) {
        this.deselectElement();
        this.selectedElement = element;
        element.classList.add('selected');
        
        // Update controls based on selected element
        const shape = element.querySelector('.shape');
        const currentBg = shape.style.background;
        
        // Update size slider
        const scale = parseFloat(element.style.transform.match(/scale\(([\d.]+)\)/)?.[1] || 1);
        document.getElementById('sizeSlider').value = scale;
    }

    deselectElement() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
            this.selectedElement = null;
        }
    }

    handleColorSelect(e) {
        // Remove active class from all colors
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
        e.target.classList.add('active');
        
        this.currentColor = e.target.dataset.color;
        
        // Apply to selected element if any
        if (this.selectedElement) {
            const shape = this.selectedElement.querySelector('.shape');
            const shapeType = this.selectedElement.classList[1]; // Get the shape type class
            
            if (shapeType === 'triangle') {
                // For triangles, we need to extract color from gradient for border
                const colorMatch = this.currentColor.match(/#[a-fA-F0-9]{6}/);
                const solidColor = colorMatch ? colorMatch[0] : '#4ecdc4';
                shape.style.borderBottomColor = solidColor;
            } else {
                shape.style.background = this.currentColor;
            }
        }
    }

    handleSizeChange(e) {
        this.currentSize = parseFloat(e.target.value);
        
        // Apply to selected element if any
        if (this.selectedElement) {
            this.selectedElement.style.transform = `scale(${this.currentSize})`;
        }
    }

    deleteSelected() {
        if (this.selectedElement) {
            this.selectedElement.remove();
            this.selectedElement = null;
            
            // Check if canvas is empty
            if (this.canvas.children.length === 0) {
                this.canvas.classList.remove('has-elements');
            }
        }
    }

    duplicateSelected() {
        if (this.selectedElement) {
            const clone = this.selectedElement.cloneNode(true);
            clone.dataset.id = ++this.elementCounter;
            clone.style.left = (parseInt(this.selectedElement.style.left) + 20) + 'px';
            clone.style.top = (parseInt(this.selectedElement.style.top) + 20) + 'px';
            
            // Re-add event listeners
            clone.addEventListener('mousedown', this.handleElementMouseDown.bind(this));
            const resizeHandle = clone.querySelector('.resize-handle');
            resizeHandle.addEventListener('mousedown', this.handleResizeStart.bind(this));
            
            this.canvas.appendChild(clone);
            this.selectElement(clone);
        }
    }

    clearCanvas() {
        if (confirm('Tem certeza que deseja limpar tudo?')) {
            this.canvas.innerHTML = '';
            this.canvas.classList.remove('has-elements');
            this.selectedElement = null;
            this.elementCounter = 0;
        }
    }

    saveToy() {
        if (this.canvas.children.length === 0) {
            alert('Adicione elementos ao seu brinquedo antes de salvar!');
            return;
        }

        // Deselect all elements before saving
        this.deselectElement();

        // Hide all resize handles before capturing
        const handles = this.canvas.querySelectorAll('.resize-handle');
        handles.forEach(handle => handle.style.display = 'none');

        html2canvas(this.canvas, {
            backgroundColor: '#ffffff',
            scale: 2,
            width: this.canvas.offsetWidth,
            height: this.canvas.offsetHeight
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'meu-brinquedo-personalizado.png';
            link.href = canvas.toDataURL();
            link.click();
            
            alert('Brinquedo salvo com sucesso! 🎉');
        }).catch(error => {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar o brinquedo. Tente novamente.');
        }).finally(() => {
            // Restore resize handles visibility
            handles.forEach(handle => handle.style.display = '');
        });
    }
}

// Initialize the toy creator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ToyCreator();
});