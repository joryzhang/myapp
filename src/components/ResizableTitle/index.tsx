import React from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';

/**
 * 可拖拽调整列宽的表头单元格
 *
 * 用法：
 *   1. 将 columns 的 width 存到 state 里
 *   2. 在 onHeaderCell 里返回 { width, onResize }
 *   3. 给 ProTable 传 components={{ header: { cell: ResizableTitle } }}
 *
 * 参见 useResizableColumns hook。
 */
const ResizableTitle: React.FC<any> = (props) => {
  const { onResize, width, ...rest } = props;

  // 没有宽度或没有 onResize 回调 → 普通 th
  if (!width || !onResize) {
    return <th {...rest} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          style={{
            position: 'absolute',
            right: -5,
            bottom: 0,
            top: 0,
            width: 10,
            cursor: 'col-resize',
            zIndex: 1,
          }}
          onClick={(e) => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...rest} />
    </Resizable>
  );
};

export default ResizableTitle;

/**
 * Hook: 让 ProColumns 支持列宽拖拽
 *
 * const { columns, components } = useResizableColumns(initialColumns);
 * <ProTable columns={columns} components={components} />
 */
export function useResizableColumns(initialColumns: any[]): {
  columns: any[];
  components: any;
} {
  const [widths, setWidths] = React.useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    initialColumns.forEach((col, i) => {
      if (col.width && typeof col.width === 'number') {
        map[i] = col.width;
      }
    });
    return map;
  });

  const handleResize = React.useCallback(
    (index: number) =>
      (_e: React.SyntheticEvent, { size }: ResizeCallbackData) => {
        setWidths((prev) => ({ ...prev, [index]: size.width }));
      },
    [],
  );

  const columns = React.useMemo(
    () =>
      initialColumns.map((col, index) => {
        const w = widths[index] ?? col.width;
        if (!w || typeof w !== 'number') return col;

        return {
          ...col,
          width: w,
          onHeaderCell: () => ({
            width: w,
            onResize: handleResize(index),
          }),
        };
      }),
    [initialColumns, widths, handleResize],
  );

  const components = React.useMemo(
    () => ({
      header: { cell: ResizableTitle },
    }),
    [],
  );

  return { columns, components };
}
