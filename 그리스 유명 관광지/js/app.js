/**
 * 그리스 온라인 사진전시관 인터랙티브 스크립트
 * '그리스, 고대의 유산과 오늘의 풍경'
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currentPlaceIndex: 0,
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    activeHotspotId: null,

    // 비교 학습 상태
    currentThemeIndex: 0,
    placeAId: 'acropolis',
    placeBId: 'santorini',

    // 퀴즈 상태
    currentQuizIndex: 0,
    userAnswers: Array(EXHIBITION_DATA.quiz.length).fill(null),
    quizConfirmed: Array(EXHIBITION_DATA.quiz.length).fill(false),
    quizScore: 0,

    // 사용자 교체 이미지 (id별 ObjectURL 또는 dataURL)
    customImages: {}
  };

  // DOM Elements
  const galleryGridEl = document.getElementById('gallery-grid');
  const detailModalEl = document.getElementById('detail-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalPrevBtn = document.getElementById('modal-prev-btn');
  const modalNextBtn = document.getElementById('modal-next-btn');

  // Viewer Elements
  const viewerWrapper = document.getElementById('viewer-wrapper');
  const viewerImage = document.getElementById('viewer-image');
  const hotspotsLayer = document.getElementById('hotspots-layer');
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const zoomResetBtn = document.getElementById('zoom-reset-btn');
  const zoomIndicator = document.getElementById('zoom-indicator');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const replaceImgBtn = document.getElementById('replace-img-btn');
  const imgFileInput = document.getElementById('img-file-input');
  const viewerFlagAlert = document.getElementById('viewer-flag-alert');
  const flagAlertText = document.getElementById('flag-alert-text');

  // Detail Panel Elements
  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalFlagBadge = document.getElementById('modal-flag-badge');
  const factsList = document.getElementById('detail-facts-list');
  const artList = document.getElementById('detail-art-list');
  const obsPointsList = document.getElementById('obs-points-list');
  const officialSourceLink = document.getElementById('official-source-link');

  // Comparison Elements
  const themeTabsWrap = document.getElementById('compare-theme-tabs');
  const compareQLabel = document.getElementById('compare-q-label');
  const compareQText = document.getElementById('compare-q-text');
  const compPlaceAImg = document.getElementById('comp-place-a-img');
  const compPlaceATitle = document.getElementById('comp-place-a-title');
  const compPlaceAPoint = document.getElementById('comp-place-a-point');
  const compPlaceBImg = document.getElementById('comp-place-b-img');
  const compPlaceBTitle = document.getElementById('comp-place-b-title');
  const compPlaceBPoint = document.getElementById('comp-place-b-point');
  const compSynthesisText = document.getElementById('comp-synthesis-text');

  // Note Elements
  const studentNoteTextarea = document.getElementById('student-note');
  const saveNoteBtn = document.getElementById('save-note-btn');
  const clearNoteBtn = document.getElementById('clear-note-btn');
  const downloadNoteBtn = document.getElementById('download-note-btn');
  const noteFeedback = document.getElementById('note-feedback');

  // Quiz Elements
  const quizActiveView = document.getElementById('quiz-active-view');
  const quizResultView = document.getElementById('quiz-result-view');
  const quizProgressBar = document.getElementById('quiz-progress-bar');
  const quizCategoryTag = document.getElementById('quiz-category-tag');
  const quizCounter = document.getElementById('quiz-counter');
  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizOptionsList = document.getElementById('quiz-options-list');
  const quizFeedbackBox = document.getElementById('quiz-feedback-box');
  const feedbackStatusBadge = document.getElementById('feedback-status-badge');
  const feedbackExplanation = document.getElementById('feedback-explanation');
  const quizConfirmBtn = document.getElementById('quiz-confirm-btn');
  const quizNextBtn = document.getElementById('quiz-next-btn');
  const quizRestartBtn = document.getElementById('quiz-restart-btn');
  const quizBackExhibitionBtn = document.getElementById('quiz-back-exhibition-btn');
  const resultReviewList = document.getElementById('result-review-list');
  const resultScoreNum = document.getElementById('result-score-num');

  /* ==========================================================================
     1. Init & Gallery Rendering
     ========================================================================== */
  function initGallery() {
    galleryGridEl.innerHTML = '';
    EXHIBITION_DATA.places.forEach((place, index) => {
      const card = document.createElement('article');
      card.className = 'gallery-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `${place.title} 상세 관람 열기`);

      const imgSrc = state.customImages[place.id] || place.image;
      const flagBadgeHtml = place.isFlagged
        ? `<div class="card-flag-badge" title="${place.flagReason}">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
             사진 확인 필요
           </div>`
        : '';

      card.innerHTML = `
        <div class="card-media">
          ${flagBadgeHtml}
          <img src="${imgSrc}" alt="${place.alt}" class="card-img" loading="lazy">
        </div>
        <div class="card-body">
          <div class="card-subtitle">${place.subtitle}</div>
          <h3 class="card-title">${place.title}</h3>
          <p class="card-desc">${place.shortDesc}</p>
          <div class="card-footer">
            <span class="card-points-count">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              관찰 포인트 ${place.observationPoints.length}개
            </span>
            <span class="btn btn-primary btn-sm">상세 관람</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => openPlaceModal(index));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPlaceModal(index);
        }
      });

      galleryGridEl.appendChild(card);
    });
  }

  /* ==========================================================================
     2. Detail Modal & High-Res Viewer
     ========================================================================== */
  function openPlaceModal(index) {
    state.currentPlaceIndex = index;
    const place = EXHIBITION_DATA.places[index];

    modalTitle.textContent = place.title;
    modalSubtitle.textContent = place.subtitle;

    // 플래그 배지 표시
    if (place.isFlagged) {
      modalFlagBadge.style.display = 'inline-flex';
      viewerFlagAlert.classList.remove('hidden');
      flagAlertText.textContent = place.flagReason;
    } else {
      modalFlagBadge.style.display = 'none';
      viewerFlagAlert.classList.add('hidden');
    }

    // 이미지 로드
    const currentImg = state.customImages[place.id] || place.image;
    viewerImage.src = currentImg;
    viewerImage.alt = place.alt;

    // 뷰어 리셋
    resetViewerTransform();

    // 핫스팟 렌더링
    renderHotspots(place);

    // 역사적 사실 렌더링
    factsList.innerHTML = place.historicalFacts.map(fact => `<li>${fact}</li>`).join('');

    // 감상 및 해석 렌더링
    artList.innerHTML = place.artisticInterpretations.map(art => `<li>${art}</li>`).join('');

    // 관찰 포인트 목록 렌더링
    renderObservationPoints(place);

    // 공식 출처 링크
    if (place.officialSource) {
      officialSourceLink.href = place.officialSource.url;
      officialSourceLink.textContent = place.officialSource.name;
      officialSourceLink.parentElement.style.display = 'block';
    } else {
      officialSourceLink.parentElement.style.display = 'none';
    }

    // 모달 활성화
    detailModalEl.classList.add('active');
    detailModalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalCloseBtn.focus();
  }

  function closePlaceModal() {
    detailModalEl.classList.remove('active');
    detailModalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // 기존 포커스로 복귀
    const activeCard = galleryGridEl.children[state.currentPlaceIndex];
    if (activeCard) activeCard.focus();
  }

  function nextPlace() {
    const nextIndex = (state.currentPlaceIndex + 1) % EXHIBITION_DATA.places.length;
    openPlaceModal(nextIndex);
  }

  function prevPlace() {
    const prevIndex = (state.currentPlaceIndex - 1 + EXHIBITION_DATA.places.length) % EXHIBITION_DATA.places.length;
    openPlaceModal(prevIndex);
  }

  /* Hotspots & Observation Points */
  function renderHotspots(place) {
    hotspotsLayer.innerHTML = '';
    place.observationPoints.forEach((pt, idx) => {
      const pin = document.createElement('button');
      pin.className = 'hotspot-pin';
      pin.style.left = `${pt.x}%`;
      pin.style.top = `${pt.y}%`;
      pin.textContent = idx + 1;
      pin.setAttribute('aria-label', `관찰 지점 ${idx + 1}: ${pt.title}`);
      pin.dataset.pointId = pt.id;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        focusObservationPoint(pt.id);
      });

      hotspotsLayer.appendChild(pin);
    });
  }

  function renderObservationPoints(place) {
    obsPointsList.innerHTML = '';
    place.observationPoints.forEach((pt, idx) => {
      const card = document.createElement('div');
      card.className = 'obs-point-card';
      card.id = `obs-card-${pt.id}`;
      card.tabIndex = 0;
      card.innerHTML = `
        <div class="obs-point-head">
          <span class="flow-step-num" style="width:20px;height:20px;font-size:0.75rem;margin:0;">${idx + 1}</span>
          <span>${pt.title}</span>
        </div>
        <p class="obs-point-body">${pt.desc}</p>
      `;

      card.addEventListener('click', () => focusObservationPoint(pt.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') focusObservationPoint(pt.id);
      });

      obsPointsList.appendChild(card);
    });
  }

  function focusObservationPoint(pointId) {
    state.activeHotspotId = pointId;

    // 핀 활성화
    const allPins = hotspotsLayer.querySelectorAll('.hotspot-pin');
    allPins.forEach(p => {
      if (p.dataset.pointId === pointId) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    // 카드 활성화 및 스크롤
    const allCards = obsPointsList.querySelectorAll('.obs-point-card');
    allCards.forEach(c => {
      if (c.id === `obs-card-${pointId}`) {
        c.classList.add('active');
        c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        c.classList.remove('active');
      }
    });
  }

  /* Viewer Zoom & Pan Controls */
  function updateViewerTransform() {
    viewerWrapper.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoomLevel})`;
    zoomIndicator.textContent = `${Math.round(state.zoomLevel * 100)}%`;
  }

  function resetViewerTransform() {
    state.zoomLevel = 1;
    state.panX = 0;
    state.panY = 0;
    updateViewerTransform();
  }

  function zoomBy(delta) {
    const prevZoom = state.zoomLevel;
    state.zoomLevel = Math.min(Math.max(state.zoomLevel + delta, 1), 3.5);
    if (state.zoomLevel === 1) {
      state.panX = 0;
      state.panY = 0;
    }
    updateViewerTransform();
  }

  zoomInBtn.addEventListener('click', () => zoomBy(0.25));
  zoomOutBtn.addEventListener('click', () => zoomBy(-0.25));
  zoomResetBtn.addEventListener('click', resetViewerTransform);

  // 마우스 휠 줌
  const viewerViewport = document.getElementById('viewer-viewport');
  viewerViewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    zoomBy(delta);
  }, { passive: false });

  // 드래그 패닝
  viewerViewport.addEventListener('mousedown', (e) => {
    if (state.zoomLevel <= 1) return;
    state.isDragging = true;
    state.dragStartX = e.clientX - state.panX;
    state.dragStartY = e.clientY - state.panY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!state.isDragging) return;
    state.panX = e.clientX - state.dragStartX;
    state.panY = e.clientY - state.dragStartY;
    updateViewerTransform();
  });

  window.addEventListener('mouseup', () => {
    state.isDragging = false;
  });

  // 전체 화면 토글
  fullscreenBtn.addEventListener('click', () => {
    const container = document.getElementById('viewer-container');
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  });

  // 사진 교체 기능 (파일 업로드 지원)
  replaceImgBtn.addEventListener('click', () => {
    imgFileInput.click();
  });

  imgFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const currentPlace = EXHIBITION_DATA.places[state.currentPlaceIndex];
      state.customImages[currentPlace.id] = dataUrl;

      // 뷰어 및 갤러리 이미지 업데이트
      viewerImage.src = dataUrl;
      initGallery();
      updateComparisonView();

      alert(`'${currentPlace.title}'의 사진이 선택하신 이미지로 교체 반영되었습니다.`);
    };
    reader.readAsDataURL(file);
  });

  /* Modal Buttons */
  modalCloseBtn.addEventListener('click', closePlaceModal);
  modalPrevBtn.addEventListener('click', prevPlace);
  modalNextBtn.addEventListener('click', nextPlace);

  // 키보드 내비게이션
  window.addEventListener('keydown', (e) => {
    if (!detailModalEl.classList.contains('active')) return;
    if (e.key === 'Escape') {
      closePlaceModal();
    } else if (e.key === 'ArrowLeft') {
      prevPlace();
    } else if (e.key === 'ArrowRight') {
      nextPlace();
    }
  });

  /* ==========================================================================
     3. Comparative Learning & Note
     ========================================================================== */
  function initComparison() {
    themeTabsWrap.innerHTML = '';
    EXHIBITION_DATA.comparisons.forEach((comp, idx) => {
      const btn = document.createElement('button');
      btn.className = `theme-tab-btn ${idx === state.currentThemeIndex ? 'active' : ''}`;
      btn.textContent = `${idx + 1}. ${comp.title}`;
      btn.addEventListener('click', () => {
        state.currentThemeIndex = idx;
        updateThemeTabs();
        updateComparisonView();
      });
      themeTabsWrap.appendChild(btn);
    });

    updateComparisonView();
    loadStudentNote();
  }

  function updateThemeTabs() {
    const btns = themeTabsWrap.querySelectorAll('.theme-tab-btn');
    btns.forEach((btn, idx) => {
      if (idx === state.currentThemeIndex) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function updateComparisonView() {
    const comp = EXHIBITION_DATA.comparisons[state.currentThemeIndex];
    compareQLabel.textContent = `비교 질문 ${state.currentThemeIndex + 1} (${comp.theme})`;
    compareQText.textContent = comp.question;

    // Place A
    const placeA = EXHIBITION_DATA.places.find(p => p.id === comp.placeA.id);
    compPlaceAImg.src = state.customImages[placeA.id] || placeA.image;
    compPlaceAImg.alt = placeA.alt;
    compPlaceATitle.textContent = comp.placeA.name;
    compPlaceAPoint.textContent = comp.placeA.point;

    // Place B
    const placeB = EXHIBITION_DATA.places.find(p => p.id === comp.placeB.id);
    compPlaceBImg.src = state.customImages[placeB.id] || placeB.image;
    compPlaceBImg.alt = placeB.alt;
    compPlaceBTitle.textContent = comp.placeB.name;
    compPlaceBPoint.textContent = comp.placeB.point;

    // Synthesis
    compSynthesisText.textContent = comp.synthesis;
  }

  /* Note LocalStorage & Export */
  const NOTE_STORAGE_KEY = 'greece_exhibition_student_notes';

  function loadStudentNote() {
    const saved = localStorage.getItem(NOTE_STORAGE_KEY);
    if (saved) {
      studentNoteTextarea.value = saved;
      showNoteFeedback('저장된 관찰 메모를 불러왔습니다.');
    }
  }

  saveNoteBtn.addEventListener('click', () => {
    const text = studentNoteTextarea.value.trim();
    localStorage.setItem(NOTE_STORAGE_KEY, text);
    showNoteFeedback('브라우저에 메모가 안전하게 저장되었습니다.');
  });

  clearNoteBtn.addEventListener('click', () => {
    if (confirm('작성 중인 메모를 모두 지우시겠습니까?')) {
      studentNoteTextarea.value = '';
      localStorage.removeItem(NOTE_STORAGE_KEY);
      showNoteFeedback('메모가 삭제되었습니다.');
    }
  });

  downloadNoteBtn.addEventListener('click', () => {
    const text = studentNoteTextarea.value;
    if (!text.trim()) {
      alert('다운로드할 메모 내용이 없습니다. 먼저 메모를 작성해 주세요.');
      return;
    }

    const header = `[그리스 온라인 사진전시관 - 학생 관찰 및 비교 메모]\n작성일시: ${new Date().toLocaleString()}\n주제: 그리스, 고대의 유산과 오늘의 풍경\n--------------------------------------------------\n\n`;
    const blob = new Blob([header + text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `그리스_전시관_관찰메모_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNoteFeedback('텍스트 파일(.txt)로 다운로드되었습니다.');
  });

  function showNoteFeedback(msg) {
    noteFeedback.textContent = msg;
    setTimeout(() => {
      noteFeedback.textContent = '메모는 현재 브라우저에만 보관되며 서버나 개인정보를 수집하지 않습니다.';
    }, 3500);
  }

  /* ==========================================================================
     4. Interactive 5-Question Quiz
     ========================================================================== */
  function renderQuizQuestion(index) {
    state.currentQuizIndex = index;
    const q = EXHIBITION_DATA.quiz[index];
    const totalQ = EXHIBITION_DATA.quiz.length;

    // 진행 바
    quizProgressBar.style.width = `${((index + 1) / totalQ) * 100}%`;
    quizCategoryTag.textContent = q.category;
    quizCounter.textContent = `${index + 1} / ${totalQ}`;
    quizQuestionText.textContent = q.question;

    // 이전 확인 여부 상태
    const isConfirmed = state.quizConfirmed[index];
    const userSelected = state.userAnswers[index];

    // 옵션 렌더링
    quizOptionsList.innerHTML = '';
    q.options.forEach((optText, optIdx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-item';
      btn.type = 'button';

      if (userSelected === optIdx) {
        btn.classList.add('selected');
      }

      if (isConfirmed) {
        btn.disabled = true;
        if (optIdx === q.answerIndex) {
          btn.classList.add('is-correct');
        } else if (userSelected === optIdx) {
          btn.classList.add('is-incorrect');
        }
      }

      btn.innerHTML = `
        <span class="quiz-option-radio" style="display:inline-block;border:2px solid currentColor;border-radius:50%;width:18px;height:18px;margin-top:2px;flex-shrink:0;"></span>
        <span><strong>${optIdx + 1}.</strong> ${optText}</span>
      `;

      btn.addEventListener('click', () => {
        if (state.quizConfirmed[index]) return;
        state.userAnswers[index] = optIdx;
        const all = quizOptionsList.querySelectorAll('.quiz-option-item');
        all.forEach((b, i) => {
          if (i === optIdx) b.classList.add('selected');
          else b.classList.remove('selected');
        });
        quizConfirmBtn.disabled = false;
      });

      quizOptionsList.appendChild(btn);
    });

    // 피드백 박스 상태
    if (isConfirmed) {
      quizFeedbackBox.classList.add('active');
      const isCorrect = userSelected === q.answerIndex;
      if (isCorrect) {
        quizFeedbackBox.className = 'quiz-feedback-box active correct';
        feedbackStatusBadge.innerHTML = '<span>✓</span> <span>정답입니다!</span>';
      } else {
        quizFeedbackBox.className = 'quiz-feedback-box active incorrect';
        feedbackStatusBadge.innerHTML = '<span>✕</span> <span>오답입니다. (정답: ' + (q.answerIndex + 1) + '번)</span>';
      }
      feedbackExplanation.textContent = q.explanation;
      quizConfirmBtn.style.display = 'none';
      quizNextBtn.style.display = 'inline-flex';
      quizNextBtn.textContent = index === totalQ - 1 ? '최종 결과 확인하기' : '다음 문항';
    } else {
      quizFeedbackBox.classList.remove('active');
      quizConfirmBtn.style.display = 'inline-flex';
      quizConfirmBtn.disabled = userSelected === null;
      quizNextBtn.style.display = 'none';
    }
  }

  // 정답 확인 버튼
  quizConfirmBtn.addEventListener('click', () => {
    const idx = state.currentQuizIndex;
    const selected = state.userAnswers[idx];
    if (selected === null) {
      alert('보기를 먼저 선택해 주세요.');
      return;
    }

    state.quizConfirmed[idx] = true;
    renderQuizQuestion(idx);
  });

  // 다음 문항 버튼
  quizNextBtn.addEventListener('click', () => {
    const nextIdx = state.currentQuizIndex + 1;
    if (nextIdx < EXHIBITION_DATA.quiz.length) {
      renderQuizQuestion(nextIdx);
    } else {
      showQuizResults();
    }
  });

  // 최종 결과 화면
  function showQuizResults() {
    quizActiveView.style.display = 'none';
    quizResultView.classList.add('active');

    // 점수 계산
    let correctCount = 0;
    EXHIBITION_DATA.quiz.forEach((q, idx) => {
      if (state.userAnswers[idx] === q.answerIndex) {
        correctCount++;
      }
    });
    state.quizScore = correctCount;

    resultScoreNum.textContent = correctCount;

    // 문항별 복습 리스트 생성
    resultReviewList.innerHTML = '';
    EXHIBITION_DATA.quiz.forEach((q, idx) => {
      const isCorrect = state.userAnswers[idx] === q.answerIndex;
      const card = document.createElement('div');
      card.className = 'result-review-card';

      const userOpt = state.userAnswers[idx] !== null ? `${state.userAnswers[idx] + 1}. ${q.options[state.userAnswers[idx]]}` : '미선택';
      const ansOpt = `${q.answerIndex + 1}. ${q.options[q.answerIndex]}`;

      card.innerHTML = `
        <div class="result-review-head">
          <span class="quiz-category-tag">${idx + 1}번 · ${q.category}</span>
          <span class="result-review-status ${isCorrect ? 'correct' : 'incorrect'}">
            ${isCorrect ? '✓ 정답' : '✕ 오답'}
          </span>
        </div>
        <p class="result-review-q">${q.question}</p>
        <div class="result-review-ans">
          <p><strong>선택한 답변:</strong> ${userOpt}</p>
          ${!isCorrect ? `<p style="color:var(--color-success);font-weight:700;"><strong>올바른 정답:</strong> ${ansOpt}</p>` : ''}
          <p style="margin-top:6px;color:var(--color-text-subtle);"><strong>해설:</strong> ${q.explanation}</p>
        </div>
        <div style="margin-top:10px;text-align:right;">
          <button class="btn btn-secondary btn-sm review-detail-btn" data-place-id="${q.targetPlaceId}">
            관련 해설 다시 보기
          </button>
        </div>
      `;

      card.querySelector('.review-detail-btn').addEventListener('click', () => {
        const placeIdx = EXHIBITION_DATA.places.findIndex(p => p.id === q.targetPlaceId);
        if (placeIdx !== -1) {
          openPlaceModal(placeIdx);
        }
      });

      resultReviewList.appendChild(card);
    });
  }

  // 다시 풀기
  quizRestartBtn.addEventListener('click', () => {
    state.currentQuizIndex = 0;
    state.userAnswers = Array(EXHIBITION_DATA.quiz.length).fill(null);
    state.quizConfirmed = Array(EXHIBITION_DATA.quiz.length).fill(false);
    state.quizScore = 0;

    quizResultView.classList.remove('active');
    quizActiveView.style.display = 'block';
    renderQuizQuestion(0);
  });

  // 전시로 돌아가기
  quizBackExhibitionBtn.addEventListener('click', () => {
    document.getElementById('gallery-section').scrollIntoView({ behavior: 'smooth' });
  });

  /* Initial Execution */
  initGallery();
  initComparison();
  renderQuizQuestion(0);
});
