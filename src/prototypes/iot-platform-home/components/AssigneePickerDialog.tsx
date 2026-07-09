import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import ElTreeSelect from './ElTreeSelect';
import ListPagination from './ListPagination';
import { MOCK_ASSIGNEES } from '../data/users';
import {
    DEFAULT_TREE_EXPANDED,
    DEPARTMENT_TREE,
    getTreeNodeLabel,
    matchesTreeSelection,
} from '../data/orgHierarchy';
import { paginateItems, DEFAULT_LIST_PAGE_SIZE } from '../utils/listPagination';
import { handleSelectableRowClick } from '../../../common/selectableRow';
import '../product-create.css';
import '../device-create.css';
import '../product-management.css';
import '../device-alarm-info.css';
import ClearableInput from './ClearableInput';

function formatAssigneeDepartment(departmentId: string) {
    const label = getTreeNodeLabel(DEPARTMENT_TREE, departmentId);
    return label.startsWith('嘉环科技 / ') ? label.slice('嘉环科技 / '.length) : label;
}

type AssigneePickerDialogProps = {
    open: boolean;
    selected: string[];
    onClose: () => void;
    onConfirm: (assignees: string[]) => void;
};

export default function AssigneePickerDialog({
    open,
    selected,
    onClose,
    onConfirm,
}: AssigneePickerDialogProps) {
    const [draftDepartment, setDraftDepartment] = useState('all');
    const [draftKeyword, setDraftKeyword] = useState('');
    const [appliedDepartment, setAppliedDepartment] = useState('all');
    const [appliedKeyword, setAppliedKeyword] = useState('');
    const [selectedNames, setSelectedNames] = useState<string[]>([]);
    const [pageSize, setPageSize] = useState('20');
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpPage, setJumpPage] = useState('1');

    useEffect(() => {
        if (!open) return;
        setDraftDepartment('all');
        setDraftKeyword('');
        setAppliedDepartment('all');
        setAppliedKeyword('');
        setSelectedNames([...selected]);
        setPageSize('10');
        setCurrentPage(1);
        setJumpPage('1');
    }, [open, selected]);

    const filteredAssignees = useMemo(() => MOCK_ASSIGNEES.filter((assignee) => {
        const matchDepartment = matchesTreeSelection(appliedDepartment, assignee.departmentId, DEPARTMENT_TREE);
        const keyword = appliedKeyword.trim();
        const matchKeyword = !keyword || assignee.name.includes(keyword);
        return matchDepartment && matchKeyword;
    }), [appliedDepartment, appliedKeyword]);

    const pagination = useMemo(
        () => paginateItems(filteredAssignees, currentPage, Number(pageSize)),
        [currentPage, filteredAssignees, pageSize],
    );

    useEffect(() => {
        setCurrentPage(1);
        setJumpPage('1');
    }, [appliedDepartment, appliedKeyword, pageSize]);

    useEffect(() => {
        setJumpPage(String(pagination.currentPage));
    }, [pagination.currentPage]);

    if (!open) return null;

    const pageNames = pagination.items.map((item) => item.name);
    const allPageSelected = pageNames.length > 0
        && pageNames.every((name) => selectedNames.includes(name));

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelectedNames((prev) => prev.filter((name) => !pageNames.includes(name)));
            return;
        }
        setSelectedNames((prev) => Array.from(new Set([...prev, ...pageNames])));
    };

    const toggleSelect = (name: string) => {
        setSelectedNames((prev) => (
            prev.includes(name)
                ? prev.filter((item) => item !== name)
                : [...prev, name]
        ));
    };

    const handleSearch = () => {
        setAppliedDepartment(draftDepartment);
        setAppliedKeyword(draftKeyword.trim());
    };

    const handleConfirm = () => {
        if (!selectedNames.length) return;
        onConfirm(selectedNames);
    };

    const handleMaskMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className="pcp-drawer-mask dcp-group-dialog-mask dai-assignee-picker-mask"
            role="presentation"
            onMouseDown={handleMaskMouseDown}
        >
            <aside
                className="pcp-drawer dcp-group-dialog dai-assignee-picker-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dai-assignee-picker-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="pcp-drawer__head">
                    <h3 id="dai-assignee-picker-title">选择指派人</h3>
                    <button type="button" className="pcp-drawer__close" onClick={onClose} aria-label="关闭">×</button>
                </div>

                <div className="pcp-drawer__body dai-assignee-picker-body">
                    <div className="dai-assignee-picker-filter">
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">所属部门</span>
                            <ElTreeSelect
                                className="el-select--medium dai-assignee-dept-select"
                                size="medium"
                                value={draftDepartment}
                                tree={DEPARTMENT_TREE}
                                defaultExpanded={DEFAULT_TREE_EXPANDED}
                                placeholder="请选择"
                                onChange={setDraftDepartment}
                            />
                        </div>
                        <div className="pm-filter-field">
                            <span className="pm-filter-label">用户名称</span>
                            <ClearableInput
                                type="text"
                                className="pm-filter-input"
                                placeholder="请输入用户名称"
                                value={draftKeyword}
                                onChange={(event) => setDraftKeyword(event.target.value)}
                            />
                        </div>
                        <button type="button" className="pm-btn pm-btn-primary" onClick={handleSearch}>
                            <Search size={14} />
                            查询
                        </button>
                    </div>

                    <div className="pm-table-wrap dai-assignee-picker-table-wrap">
                        <table className="pm-table pm-table--assignee-picker">
                            <thead>
                                <tr>
                                    <th className="dai-assignee-picker-check-col">
                                        <label className="dai-assignee-picker-check-all">
                                            <input
                                                type="checkbox"
                                                checked={allPageSelected}
                                                onChange={toggleSelectAll}
                                            />
                                            <span>全选</span>
                                        </label>
                                    </th>
                                    <th>用户名称</th>
                                    <th>手机号码</th>
                                    <th>所属角色</th>
                                    <th>所属部门</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.items.map((assignee) => (
                                    <tr
                                        key={assignee.id}
                                        className="iot-selectable-row"
                                        onClick={(event) => handleSelectableRowClick(
                                            event,
                                            () => toggleSelect(assignee.name),
                                        )}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                aria-label={`选择 ${assignee.name}`}
                                                checked={selectedNames.includes(assignee.name)}
                                                onChange={() => toggleSelect(assignee.name)}
                                            />
                                        </td>
                                        <td>{assignee.name}</td>
                                        <td>{assignee.phone}</td>
                                        <td>{assignee.role}</td>
                                        <td>{formatAssigneeDepartment(assignee.departmentId)}</td>
                                    </tr>
                                ))}
                                {!pagination.items.length && (
                                    <tr>
                                        <td colSpan={5} className="dai-assignee-picker-empty">暂无匹配用户</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <ListPagination
                        total={pagination.total}
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        pageSize={pageSize}
                        jumpPage={jumpPage}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        onJumpPageChange={setJumpPage}
                    />
                </div>

                <div className="pcp-drawer__foot">
                    <button type="button" className="pm-btn pm-btn-ghost" onClick={onClose}>取消</button>
                    <button
                        type="button"
                        className="pm-btn pm-btn-primary"
                        disabled={!selectedNames.length}
                        onClick={handleConfirm}
                    >
                        确定
                    </button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
