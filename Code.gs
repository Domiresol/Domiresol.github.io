// 결혼식 사진 업로드용 Apps Script 백엔드
// 배포: 웹 앱 / 실행 - 나 / 액세스 - 모든 사용자
// 실제 배포는 script.google.com 에서 관리함. 이 파일은 기록용 사본.

var PARENT_FOLDER_ID = '1499_i2Zs3qbZlZE6SSXfnqZELQVJPw7M';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var name = (data.name || '').trim();
    // 프론트에서 용량 큰 업로드는 배치로 쪼개서 여러 번 보냄.
    // 첫 배치는 folderId 없이 옴(새/기존 폴더 사용), 이후 배치는 같은 폴더에 이어 담기 위해 folderId를 실어 보냄.
    var folderId = data.folderId || null;

    if (!folderId) {
      if (!name) throw new Error('이름을 입력해주세요.');
      if (name.length > 30) throw new Error('이름이 너무 깁니다.');
    }

    var files = data.files || [];
    if (!files.length) throw new Error('업로드할 파일이 없습니다.');

    // 아이폰 HEIC처럼 이미지인데 mimeType이 애매한 경우가 있어서
    // "이미지만 허용" 대신 "영상만 거절"하는 방식으로 검사함.
    // 프론트에서도 같은 검사를 하지만, API 직접 호출 우회 대비 서버에서도 한 번 더 막음.
    var BLOCKED_VIDEO_EXT = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.wmv', '.flv', '.m4v'];
    for (var v = 0; v < files.length; v++) {
      var vf = files[v];
      var lowerName = (vf.filename || '').toLowerCase();
      var isVideo = (vf.mimeType || '').indexOf('video/') === 0 ||
        BLOCKED_VIDEO_EXT.some(function (ext) { return lowerName.slice(-ext.length) === ext; });
      if (isVideo) throw new Error('영상은 업로드할 수 없습니다: ' + vf.filename);
    }

    var folder;
    if (folderId) {
      // 배치 이어받기: 기존 폴더 그대로 사용
      folder = DriveApp.getFolderById(folderId);
    } else {
      // 같은 이름 폴더가 있으면 재사용, 없으면 새로 생성.
      // 동시에 같은 이름으로 첫 업로드가 겹치면 폴더가 중복 생성될 수 있음(하객 규모면 확률 낮음, 감수하기로 함).
      var parent = DriveApp.getFolderById(PARENT_FOLDER_ID);
      folder = getOrCreateFolder(parent, name);
    }

    var uploaded = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var blob = Utilities.newBlob(
        Utilities.base64Decode(f.data),
        f.mimeType,
        f.filename
      );
      var file = folder.createFile(blob);
      uploaded.push({ filename: f.filename, url: file.getUrl() });
    }

    // folderId를 응답에 실어 보냄 - 프론트가 다음 배치 요청에 그대로 담아 보내기 위함
    return jsonResponse({
      ok: true,
      folderId: folder.getId(),
      folder: folder.getName(),
      count: uploaded.length,
      files: uploaded
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function getOrCreateFolder(parent, name) {
  var folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
