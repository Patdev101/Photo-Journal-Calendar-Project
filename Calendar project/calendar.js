// ============ DATA ============
const monthNames = ["January","February","March","April","May","June",
                   "July","August","September","October","November","December"];

let currentDate = new Date(2026, 0, 1);
let photos = [];
let activeCell = null;
let activeImg = null;
let currentSlide = 0;
let locationDetected = false;

// Date picker state
let pickerYear = 2026;
let pickerMonth = 0;

// ============ ADD PHOTO MODAL ============
let tempPhotoData = {
    file: null,
    location: '',
    description: '',
    date: null,
    cell: null
};

function openAddPhoto(cell) {
    tempPhotoData.cell = cell;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = parseInt(cell.querySelector('.date').textContent);
    tempPhotoData.date = { year, month, day };
    
    document.getElementById('addPhotoDate').textContent = `Date: ${monthNames[month]} ${day}, ${year}`;
    
    // Reset form
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('previewImage').style.display = 'none';
    document.getElementById('previewImage').src = '';
    document.getElementById('addLocation').value = '';
    document.getElementById('addDescription').value = '';
    document.getElementById('uploadArea').classList.remove('has-image');
    document.getElementById('autoDetectBadge').textContent = '📍 Auto-detecting...';
    document.getElementById('autoDetectBadge').className = 'auto-detect-badge';
    
    // Detect location
    getLocation(loc => {
        if (loc) {
            document.getElementById('addLocation').value = loc;
            document.getElementById('autoDetectBadge').textContent = '📍 Auto-detected';
            document.getElementById('autoDetectBadge').className = 'auto-detect-badge detected';
        } else {
            document.getElementById('autoDetectBadge').textContent = '📍 Not detected - add manually';
            document.getElementById('autoDetectBadge').className = 'auto-detect-badge';
        }
    });
    
    document.getElementById('addPhotoOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAddPhoto() {
    document.getElementById('addPhotoOverlay').classList.remove('active');
    document.body.style.overflow = '';
    tempPhotoData.file = null;
}

// File input for add photo modal
document.getElementById('fileInput').onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    tempPhotoData.file = file;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('previewImage').src = event.target.result;
        document.getElementById('previewImage').style.display = 'block';
        document.getElementById('uploadPlaceholder').style.display = 'none';
        document.getElementById('uploadArea').classList.add('has-image');
    };
    reader.readAsDataURL(file);
};

function savePhoto() {
    if (!tempPhotoData.file) {
        alert('Please select a photo first.');
        return;
    }
    
    const file = tempPhotoData.file;
    const location = document.getElementById('addLocation').value.trim();
    const description = document.getElementById('addDescription').value.trim();
    const { year, month, day } = tempPhotoData.date;
    
    const src = URL.createObjectURL(file);
    const id = Date.now();
    
    const photo = {
        id,
        src,
        dateString: `${monthNames[month]} ${day}, ${year}`,
        location: location || '',
        locationDetected: false,
        desc: description || '',
        year,
        month,
        day,
        inSlider: false
    };
    
    photos.push(photo);
    
    // Add to calendar
    const cell = tempPhotoData.cell;
    const img = document.createElement('img');
    img.className = 'photo';
    img.src = src;
    img.dataset.id = id;
    img.onclick = () => openViewer(img);
    cell.appendChild(img);
    
    const btn = cell.querySelector('.add-btn');
    btn.classList.add('small');
    
    closeAddPhoto();
    updateSlider();
    openViewer(img);
}

// ============ NOTE FUNCTIONS ============
function editNote() {
    const display = document.getElementById('noteDisplay');
    const edit = document.getElementById('noteEdit');
    display.style.display = 'none';
    edit.style.display = 'block';
    const currentText = display.textContent;
    if (currentText.includes('Free area')) {
        edit.value = '';
    } else {
        edit.value = currentText;
    }
    edit.focus();
    edit.select();
}

function saveNote() {
    const display = document.getElementById('noteDisplay');
    const edit = document.getElementById('noteEdit');
    const val = edit.value.trim();
    if (val) {
        display.textContent = val;
    } else {
        display.innerHTML = 'Free area or<br>note area';
    }
    display.style.display = 'block';
    edit.style.display = 'none';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    localStorage.setItem(`note_${year}_${month}`, val);
}

function loadNote() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const display = document.getElementById('noteDisplay');
    const saved = localStorage.getItem(`note_${year}_${month}`);
    if (saved) {
        display.textContent = saved;
    } else {
        display.innerHTML = 'Free area or<br>note area';
    }
}

// Close note edit on click outside
document.addEventListener('click', function(e) {
    const footer = document.querySelector('.footer-left');
    const edit = document.getElementById('noteEdit');
    if (footer && !footer.contains(e.target) && edit.style.display === 'block') {
        saveNote();
    }
});

// ============ DATE PICKER ============
function openDatePicker() {
    pickerYear = currentDate.getFullYear();
    pickerMonth = currentDate.getMonth();
    document.getElementById('datePickerOverlay').classList.add('active');
    renderPickerMonths();
}

function closeDatePicker() {
    document.getElementById('datePickerOverlay').classList.remove('active');
}

function changePickerYear(delta) {
    pickerYear += delta;
    renderPickerMonths();
}

function renderPickerMonths() {
    document.getElementById('pickerYearLabel').textContent = pickerYear;
    const container = document.getElementById('pickerMonths');
    container.innerHTML = '';
    
    monthNames.forEach((name, index) => {
        const btn = document.createElement('button');
        btn.className = 'date-picker-month';
        if (index === pickerMonth && pickerYear === currentDate.getFullYear()) {
            btn.classList.add('selected');
        }
        btn.textContent = name;
        btn.onclick = () => {
            document.querySelectorAll('.date-picker-month').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            pickerMonth = index;
        };
        container.appendChild(btn);
    });
}

function goToSelectedDate() {
    currentDate = new Date(pickerYear, pickerMonth, 1);
    closeDatePicker();
    buildCalendar();
}

// Close date picker on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDatePicker();
        closeViewer();
        closeAddPhoto();
    }
});

// ============ GEOLOCATION ============
function getLocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const { latitude, longitude } = pos.coords;
                fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
                    .then(res => res.json())
                    .then(data => {
                        const city = data.city || data.locality || data.principalSubdivision || "";
                        const street = data.street || "";
                        
                        let location = "";
                        if (street && city) {
                            location = `${street}, ${city}`;
                        } else if (street) {
                            location = street;
                        } else if (city) {
                            location = city;
                        }
                        
                        locationDetected = !!location;
                        callback(location);
                    })
                    .catch(() => {
                        locationDetected = false;
                        callback("");
                    });
            },
            () => {
                locationDetected = false;
                callback("");
            }
        );
    } else {
        locationDetected = false;
        callback("");
    }
}

// ============ CALENDAR ============
function buildCalendar() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('monthDisplay').textContent = monthNames[month];
    document.getElementById('yearDisplay').textContent = year;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < 42; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        
        if (i < firstDay || i >= firstDay + daysInMonth) {
            cell.classList.add('empty');
        } else {
            const dayNum = i - firstDay + 1;
            const dateLabel = document.createElement('div');
            dateLabel.className = 'date';
            dateLabel.textContent = dayNum;
            cell.appendChild(dateLabel);
            
            // Check existing photo
            const existing = photos.find(p => p.year === year && p.month === month && p.day === dayNum);
            
            if (existing) {
                const img = document.createElement('img');
                img.className = 'photo';
                img.src = existing.src;
                img.dataset.id = existing.id;
                img.onclick = () => openViewer(img);
                cell.appendChild(img);
            }
            
            const btn = document.createElement('button');
            btn.className = existing ? 'add-btn small' : 'add-btn';
            btn.textContent = '+';
            btn.onclick = () => {
                openAddPhoto(cell);
            };
            cell.appendChild(btn);
        }
        grid.appendChild(cell);
    }
    loadNote();
    updateSlider();
}

// ============ VIEWER ============
function openViewer(img) {
    activeImg = img;
    const photo = photos.find(p => p.id == img.dataset.id);
    if (!photo) return;
    
    document.getElementById('viewerImage').src = photo.src;
    document.getElementById('viewerDate').textContent = photo.dateString;
    
    // Update heart button
    const heartBtn = document.getElementById('heartBtn');
    const heartIcon = heartBtn.querySelector('.heart-icon');
    if (photo.inSlider) {
        heartBtn.classList.add('active');
        heartIcon.textContent = '♥';
    } else {
        heartBtn.classList.remove('active');
        heartIcon.textContent = '♡';
    }
    
    // Location
    const display = document.getElementById('viewerLocationDisplay');
    const edit = document.getElementById('viewerLocationEdit');
    const badge = document.getElementById('locationBadge');
    
    if (photo.location && photo.location.trim()) {
        display.innerHTML = photo.location;
        display.querySelector('.location-placeholder')?.remove();
    } else {
        display.innerHTML = '<span class="location-placeholder">Click to add city or street</span>';
    }
    edit.value = photo.location || '';
    display.style.display = 'inline-block';
    edit.style.display = 'none';
    
    // Update badge
    if (photo.locationDetected && photo.location) {
        badge.textContent = '📍 Auto-detected';
        badge.className = 'location-badge detected';
    } else if (photo.location) {
        badge.textContent = '📍 Manually added';
        badge.className = 'location-badge not-detected';
    } else {
        badge.textContent = '📍 Not detected';
        badge.className = 'location-badge not-detected';
    }
    
    // Description
    const descDisplay = document.getElementById('viewerDescDisplay');
    const descEdit = document.getElementById('viewerDescEdit');
    if (photo.desc && photo.desc.trim()) {
        descDisplay.innerHTML = photo.desc;
        descDisplay.querySelector('.desc-placeholder')?.remove();
    } else {
        descDisplay.innerHTML = '<span class="desc-placeholder">Add Description</span>';
    }
    descEdit.value = photo.desc || '';
    descDisplay.style.display = 'block';
    descEdit.style.display = 'none';
    
    document.getElementById('viewer').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeViewer() {
    document.getElementById('viewer').style.display = 'none';
    document.body.style.overflow = '';
}

function closeViewerOnClick(e) {
    if (e.target === e.currentTarget) {
        closeViewer();
    }
}

function toggleHeart() {
    if (!activeImg) return;
    const photo = photos.find(p => p.id == activeImg.dataset.id);
    if (!photo) return;
    
    photo.inSlider = !photo.inSlider;
    
    const heartBtn = document.getElementById('heartBtn');
    const heartIcon = heartBtn.querySelector('.heart-icon');
    if (photo.inSlider) {
        heartBtn.classList.add('active');
        heartIcon.textContent = '♥';
    } else {
        heartBtn.classList.remove('active');
        heartIcon.textContent = '♡';
    }
    
    updateSlider();
}

function editLocation() {
    const display = document.getElementById('viewerLocationDisplay');
    const edit = document.getElementById('viewerLocationEdit');
    display.style.display = 'none';
    edit.style.display = 'inline-block';
    edit.focus();
    edit.select();
}

function saveLocation() {
    const display = document.getElementById('viewerLocationDisplay');
    const edit = document.getElementById('viewerLocationEdit');
    const badge = document.getElementById('locationBadge');
    const val = edit.value.trim();
    
    if (val) {
        display.innerHTML = val;
        badge.textContent = '📍 Manually added';
        badge.className = 'location-badge not-detected';
    } else {
        display.innerHTML = '<span class="location-placeholder">Click to add city or street</span>';
        badge.textContent = '📍 Not detected';
        badge.className = 'location-badge not-detected';
    }
    display.style.display = 'inline-block';
    edit.style.display = 'none';
    
    if (activeImg) {
        const photo = photos.find(p => p.id == activeImg.dataset.id);
        if (photo) {
            photo.location = val;
            photo.locationDetected = false;
        }
    }
}

function editDescription() {
    const display = document.getElementById('viewerDescDisplay');
    const edit = document.getElementById('viewerDescEdit');
    display.style.display = 'none';
    edit.style.display = 'block';
    edit.focus();
    const photo = photos.find(p => p.id == activeImg?.dataset.id);
    if (photo) edit.value = photo.desc || '';
}

function saveDescription() {
    const display = document.getElementById('viewerDescDisplay');
    const edit = document.getElementById('viewerDescEdit');
    const val = edit.value.trim();
    
    if (val) {
        display.innerHTML = val;
    } else {
        display.innerHTML = '<span class="desc-placeholder">Add Description</span>';
    }
    display.style.display = 'block';
    edit.style.display = 'none';
    
    if (activeImg) {
        const photo = photos.find(p => p.id == activeImg.dataset.id);
        if (photo) photo.desc = val;
    }
}

function deletePhoto() {
    if (!activeImg) return;
    if (!confirm('Delete this photo?')) return;
    
    const id = activeImg.dataset.id;
    photos = photos.filter(p => p.id != id);
    
    const cell = activeImg.parentElement;
    activeImg.remove();
    const btn = cell.querySelector('.add-btn');
    if (!cell.querySelector('.photo')) btn.classList.remove('small');
    
    closeViewer();
    updateSlider();
}

// ============ MONTH NAV ============
function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    buildCalendar();
}

function goToToday() {
    currentDate = new Date();
    buildCalendar();
}

// ============ SLIDER ============
function updateSlider() {
    const track = document.getElementById('sliderTrack');
    const dots = document.getElementById('sliderDots');
    track.innerHTML = '';
    dots.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const sliderPhotos = photos
        .filter(p => p.year === year && p.month === month && p.inSlider)
        .slice(0, 3);
    
    if (sliderPhotos.length === 0) {
        track.innerHTML = `<div class="slider-slide" style="text-align:center;padding:40px 20px;color:#999;font-size:14px;">
            ❤️ Favorite photos appear here<br><span style="font-size:12px;color:#bbb;">Click the heart on any photo to add it</span>
        </div>`;
        const dot = document.createElement('button');
        dot.className = 'slider-dot active';
        dots.appendChild(dot);
        return;
    }
    
    sliderPhotos.forEach((p, i) => {
        const slide = document.createElement('div');
        slide.className = 'slider-slide';
        slide.innerHTML = `
            <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <img src="${p.src}" style="width:100%;height:200px;object-fit:cover;display:block;">
                <div style="padding:12px 16px 14px;">
                    <div style="font-weight:600;font-size:13px;">${p.dateString}</div>
                    <div style="font-size:12px;color:#888;margin-top:2px;">${p.location || 'No location'}</div>
                    ${p.desc ? `<div style="font-size:13px;color:#444;margin-top:6px;line-height:1.5;">${p.desc.substring(0,80)}${p.desc.length>80?'...':''}</div>` : ''}
                </div>
            </div>
        `;
        track.appendChild(slide);
        
        const dot = document.createElement('button');
        dot.className = i === 0 ? 'slider-dot active' : 'slider-dot';
        dot.onclick = () => goToSlide(i);
        dots.appendChild(dot);
    });
    
    currentSlide = 0;
    track.style.transform = 'translateX(0)';
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.slider-slide');
    if (index < 0 || index >= slides.length) return;
    currentSlide = index;
    document.getElementById('sliderTrack').style.transform = `translateX(-${index * 100}%)`;
    document.querySelectorAll('.slider-dot').forEach((d, i) => {
        d.classList.toggle('active', i === index);
    });
}

document.getElementById('prevSlideBtn').onclick = () => {
    const slides = document.querySelectorAll('.slider-slide');
    goToSlide(currentSlide > 0 ? currentSlide - 1 : slides.length - 1);
};
document.getElementById('nextSlideBtn').onclick = () => {
    const slides = document.querySelectorAll('.slider-slide');
    goToSlide(currentSlide < slides.length - 1 ? currentSlide + 1 : 0);
};

// ============ INIT ============
function initSamplePhotos() {
    if (photos.length === 0) {
        const samplePhotos = [
            {
                id: 1,
                src: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800',
                dateString: 'January 5, 2026',
                location: 'Tokyo, Japan',
                locationDetected: true,
                desc: 'Beautiful sunset at Shibuya Crossing',
                year: 2026,
                month: 0,
                day: 5,
                inSlider: true
            },
            {
                id: 2,
                src: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
                dateString: 'January 12, 2026',
                location: 'Bali, Indonesia',
                locationDetected: true,
                desc: 'Tropical paradise with crystal clear water',
                year: 2026,
                month: 0,
                day: 12,
                inSlider: true
            },
            {
                id: 3,
                src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
                dateString: 'January 18, 2026',
                location: 'Paris, France',
                locationDetected: true,
                desc: 'Romantic evening at Eiffel Tower',
                year: 2026,
                month: 0,
                day: 18,
                inSlider: true
            },
            {
                id: 4,
                src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
                dateString: 'January 25, 2026',
                location: 'New York, USA',
                locationDetected: true,
                desc: 'Amazing view of the city skyline',
                year: 2026,
                month: 0,
                day: 25,
                inSlider: false
            }
        ];
        
        photos = samplePhotos;
        buildCalendar();
    }
}

buildCalendar();
setTimeout(initSamplePhotos, 300);