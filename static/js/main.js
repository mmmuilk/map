// Initialize the map and load existing comments
const map = new AMap.Map('map', {
    center: [117.145, 34.217],           // Center coordinates (CUMT Library vicinity)
    zoom: 17,
    viewMode: '3D',
    pitch: 45,                          // 3D view pitch (0-83)
    doubleClickZoom: false              // Disable default double-click zoom (we use double-click for adding marker)
  });
  // Add map controls for zoom and scale
  map.addControl(new AMap.Scale());
  map.addControl(new AMap.ToolBar());
  
  // Elements for modals and forms
  const addModal = document.getElementById('addCommentModal');
  const detailOverlay = document.getElementById('detailOverlay');
  const commentForm = document.getElementById('commentForm');
  const replyForm = document.getElementById('replyForm');
  const commentLatInput = document.getElementById('commentLat');
  const commentLngInput = document.getElementById('commentLng');
  const replyCommentIdInput = document.getElementById('replyCommentId');
  const commentDetailDiv = document.getElementById('commentDetail');
  const repliesListDiv = document.getElementById('repliesList');
  
  // Utility: create a DOM element for a reply item
  function createReplyElement(reply) {
    const replyDiv = document.createElement('div');
    replyDiv.className = 'reply-item';
    // Name and time
    const metaP = document.createElement('p');
    const nameStrong = document.createElement('strong');
    nameStrong.textContent = reply.name + ' ';
    metaP.appendChild(nameStrong);
    if (reply.created_at) {
      const timeSmall = document.createElement('small');
      timeSmall.textContent = `(${reply.created_at})`;
      metaP.appendChild(timeSmall);
    }
    replyDiv.appendChild(metaP);
    // Text content
    const textP = document.createElement('p');
    textP.textContent = reply.text;
    replyDiv.appendChild(textP);
    // Image if present
    if (reply.img_url) {
      const imgEl = document.createElement('img');
      imgEl.src = reply.img_url;
      imgEl.className = 'reply-image';
      replyDiv.appendChild(imgEl);
    }
    return replyDiv;
  }
  
  // Open the add-comment modal for a given map coordinate
  function openCommentForm(lat, lng) {
    // Reset form fields and set coordinates
    commentForm.reset();
    commentLatInput.value = lat;
    commentLngInput.value = lng;
    addModal.style.display = 'flex';
  }
  
  // Close all overlays (add comment or detail)
  function closeOverlays() {
    addModal.style.display = 'none';
    detailOverlay.style.display = 'none';
  }
  
  // Populate and show the detail overlay for a specific comment (with replies)
  function showCommentDetail(data) {
    // Clear previous content
    commentDetailDiv.innerHTML = '';
    repliesListDiv.innerHTML = '';
    // Populate comment details (name, time, text, image)
    const comment = data.comment;
    const detailMeta = document.createElement('p');
    const nameStrong = document.createElement('strong');
    nameStrong.textContent = comment.name + ' ';
    detailMeta.appendChild(nameStrong);
    if (comment.created_at) {
      const timeSmall = document.createElement('small');
      timeSmall.textContent = `(${comment.created_at})`;
      detailMeta.appendChild(timeSmall);
    }
    commentDetailDiv.appendChild(detailMeta);
    const textP = document.createElement('p');
    textP.textContent = comment.text;
    commentDetailDiv.appendChild(textP);
    if (comment.img_url) {
      const imgEl = document.createElement('img');
      imgEl.src = comment.img_url;
      imgEl.className = 'comment-image';
      commentDetailDiv.appendChild(imgEl);
    }
    // Populate replies list
    data.replies.forEach(reply => {
      repliesListDiv.appendChild(createReplyElement(reply));
    });
    // Prepare reply form for this comment
    replyForm.reset();
    replyCommentIdInput.value = comment.id;
    // Show the overlay
    detailOverlay.style.display = 'flex';
  }
  
  // Fetch and display all comments (markers on map)
  function loadComments() {
    fetch('/api/comments')
      .then(response => response.json())
      .then(data => {
        if (!data.success) {
          console.error('Failed to load comments:', data.error);
          return;
        }
        data.comments.forEach(comment => {
          // Create a marker with a custom content (floating bubble)
          const contentDiv = document.createElement('div');
          contentDiv.className = 'marker-bubble';
          contentDiv.innerText = comment.text;
          const marker = new AMap.Marker({
            position: [comment.lng, comment.lat],
            content: contentDiv,
            offset: new AMap.Pixel(0, 0),   // will adjust after adding
            extData: { id: comment.id }
          });
          // Add marker to map
          map.add(marker);
          // Adjust marker offset to center the bubble above the coordinate
          const w = contentDiv.offsetWidth;
          const h = contentDiv.offsetHeight;
          marker.setOffset(new AMap.Pixel(-w / 2, -h));
          // Marker click -> fetch detail and show overlay
          marker.on('click', function(e) {
            const cid = e.target.getExtData().id;
            fetch(`/api/comments/${cid}`)
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  showCommentDetail(data);
                } else {
                  alert(data.error || '加载留言详情失败');
                }
              })
              .catch(err => console.error('Error fetching comment detail:', err));
          });
        });
      })
      .catch(err => console.error('Error loading comments:', err));
  }
  
  // Event: double-click on map to add a new comment at that location
  map.on('dblclick', function(event) {
    const lnglat = event.lnglat;
    openCommentForm(lnglat.getLat(), lnglat.getLng());
  });
  
  // Event: close buttons on modals
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', closeOverlays);
  });
  
  // Handle comment form submission (new comment)
  commentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    // HTML5 form validation
    if (!commentForm.checkValidity()) {
      commentForm.reportValidity();
      return;
    }
    const formData = new FormData(commentForm);
    fetch('/api/comments', {
      method: 'POST',
      body: formData
    }).then(res => res.json())
      .then(data => {
        if (data.success) {
          // Add the new comment marker to the map
          const c = data.comment;
          const contentDiv = document.createElement('div');
          contentDiv.className = 'marker-bubble';
          contentDiv.innerText = c.text;
          const marker = new AMap.Marker({
            position: [c.lng, c.lat],
            content: contentDiv,
            offset: new AMap.Pixel(0, 0),
            extData: { id: c.id }
          });
          map.add(marker);
          // Adjust bubble position
          const w = contentDiv.offsetWidth;
          const h = contentDiv.offsetHeight;
          marker.setOffset(new AMap.Pixel(-w / 2, -h));
          // Attach click event to new marker
          marker.on('click', function(e) {
            const cid = e.target.getExtData().id;
            fetch(`/api/comments/${cid}`)
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  showCommentDetail(data);
                } else {
                  alert(data.error || '加载留言详情失败');
                }
              })
              .catch(err => console.error('Error fetching comment detail:', err));
          });
          // Close modal and reset form
          addModal.style.display = 'none';
          commentForm.reset();
        } else {
          alert(data.error || '提交留言失败');
        }
      })
      .catch(err => {
        console.error('Error submitting comment:', err);
        alert('提交留言失败');
      });
  });
  
  // Handle reply form submission (new reply)
  replyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!replyForm.checkValidity()) {
      replyForm.reportValidity();
      return;
    }
    const formData = new FormData(replyForm);
    fetch('/api/replies', {
      method: 'POST',
      body: formData
    }).then(res => res.json())
      .then(data => {
        if (data.success) {
          const reply = data.reply;
          // Append the new reply to the list in the UI
          repliesListDiv.appendChild(createReplyElement(reply));
          // Clear the reply form fields (keep comment_id for potential additional replies)
          replyForm.querySelector('input[name="name"]').value = '';
          replyForm.querySelector('textarea[name="text"]').value = '';
          if (replyForm.querySelector('input[name="image"]')) {
            replyForm.querySelector('input[name="image"]').value = '';
          }
        } else {
          alert(data.error || '回复失败');
        }
      })
      .catch(err => {
        console.error('Error submitting reply:', err);
        alert('回复失败');
      });
  });
  
  // Initial load: fetch existing comments and display markers
  loadComments();