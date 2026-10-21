import { useCallback, useRef, useState, type DragEvent } from 'react';
import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';

export function FileUploader() {
  const { loadFile, state } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const onFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      await loadFile(file);
    },
    [loadFile],
  );

  const onDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false);
      await onFiles(event.dataTransfer.files);
    },
    [onFiles],
  );

  return (
    <section className={styles.hero}>
      <h1 className={styles.heroBrand}>Анализ структуры Oriflame</h1>
      <p className={styles.heroText}>
        Загрузите информационный листок Excel — приложение разберёт его локально
        в браузере, поможет выбрать ваш номер партнёра и покажет структуру,
        поиск и аналитику без отправки данных на сервер.
      </p>

      <div className={styles.privacyNote}>
        <strong>Приватность.</strong> Файл читается только через File API в
        оперативной памяти. Отчёт не сохраняется в localStorage, cookies и не
        уходит во внешние сервисы. После очистки или перезагрузки страницы данные
        исчезают.
      </div>

      <div
        className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <p className={styles.panelLead}>
          Перетащите файл сюда или выберите на устройстве
        </p>
        <p className={styles.muted}>Поддерживаемые форматы: .xlsx, .xls</p>
        <div className={styles.row} style={{ justifyContent: 'center' }}>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={state.isParsing}
            onClick={() => inputRef.current?.click()}
          >
            {state.isParsing ? 'Обработка…' : 'Выбрать файл'}
          </button>
        </div>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={(e) => {
            void onFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Как выбрать свой номер</h2>
        <ol className={styles.list}>
          <li>После загрузки проверьте отчёт о распознавании колонок.</li>
          <li>
            Приложение предложит номер из шапки файла или первой корректной
            строки — подтвердите ФИО.
          </li>
          <li>При необходимости введите другой номер вручную.</li>
          <li>Автоматически считать первую строку владельцем без подтверждения нельзя.</li>
        </ol>
      </div>

      {state.importError ? (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {state.importError}
        </div>
      ) : null}
    </section>
  );
}
