# HTML Slider

A PowerPoint-like presentation player for HTML files.

## Features

- Create presentations with multiple HTML pages
- Add HTML files as presentation pages
- Generate thumbnails for each page
- Reorder pages via drag and drop
- Play presentations in fullscreen mode
- Keyboard navigation during playback (arrow keys and spacebar)

## How to Run

1. **Prerequisites**:
   - Python 3.x installed on your system

2. **Start the local server**:
   ```bash
   # Navigate to project root directory
   
   # Start the Python HTTP server
   python -m http.server 8000
   ```

3. **Access the application**:
   Open your web browser and navigate to:
   ```
   http://localhost:8000/html-slider/
   ```

## Usage

1. **Create a new presentation**:
   - Click "Create New Presentation"
   - Enter a presentation name
   - Optionally select multiple HTML files to add as pages
   - Click "Create"

2. **Add pages**:
   - Select a presentation
   - Click "Add Page"
   - Select an HTML file to add

3. **Reorder pages**:
   - Drag and drop pages in the desired order

4. **Play presentation**:
   - Select a presentation
   - Click "Play Presentation"
   - Use arrow keys or spacebar to navigate through slides
