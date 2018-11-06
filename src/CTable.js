import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import common, {GetDomXY} from './Common';
import {
    Icon,
    Pagination
} from '@clake/react-bootstrap4';
import './css/CTable.less';
import Drag from "./Drag";

class CTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data     : this.props.data,
            dataCount: this.props.dataCount,
            page     : 1,
            select   : this.props.select,
        };

        this.domId = 'table-' + common.RandomString(16);

        this.select_all = false;

        this.selectRows = {};

        this.sortList = {};

        this.initTableWidth();

        this.headerSplits = [];
    }

    componentDidMount() {
        this.bindSplit();
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.data !== nextProps.data) {
            this.select_all = false;
            this.selectRows = {};
            this.setState({
                data     : nextProps.data,
                dataCount: nextProps.dataCount,
                page     : nextProps.page,
            });
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.data !== this.state.data || nextState.tree !== this.state.tree;
    }

    initTableWidth() {
        if (this.props.width) {
            this.width = 0;
            let reg    = /(\d+)(px|rem|cm|mm|pt)$/;
            let matchs = this.props.width.match(reg);
            let unit   = matchs[2];
            React.Children.map(this.props.children, (item, key) => {
                if (item.props.width) {
                    let matchs = item.props.width.match(reg);
                    this.width += parseInt(matchs[1]);
                }
            });
            if (this.props.select) {
                this.width += 20;
            }
            this.width += unit;
        }
    }

    changeHandler(row, i) {
        return (e) => {
            if (e.target.checked) {
                this.selectRows[i] = row;
            } else {
                this.selectRows[i] = undefined;
            }
            if (typeof this.props.onCheck === "function") {
                this.props.onCheck(e.target.checked, row);
            }
        };
    }

    clickHandler(row, i) {
        return () => {
            if (typeof this.props.onClick === 'function') {
                this.props.onClick(row, i);
            }
        }
    }

    sortHandler(field, callback) {
        return (e) => {
            let dom       = e.currentTarget;
            let sort_type = dom.dataset.sort || 'asc';
            callback(field, sort_type);
            dom.dataset.sort     = sort_type === 'asc' ? 'desc' : 'asc';
            this.sortList[field] = sort_type;
            let child            = dom.querySelector('i');
            child.classList.remove('fa-sort', 'fa-sort-alpha-up', 'fa-sort-alpha-down');
            child.classList.add('fa-sort-alpha-' + (sort_type === 'asc' ? 'down' : 'up'));
        }
    };

    scrollHandler = (e) => {
        this.tableHeader.style.transform = `translateX(-${e.currentTarget.scrollLeft}px)`;
    };

    selectPageHandler = (page) => {
        if (typeof this.props.onSelectPage === 'function') {
            this.props.onSelectPage(page);
        }
    };

    selectAll = (e) => {
        this.select_all = e.target.checked;
        common.map(this.refs, (item) => {
            item.checked = this.select_all;
        });
    };

    /**
     * 得到所有选中的行
     * @returns {*}
     */
    getSelectRows() {
        return common.map(this.selectRows, (item) => {
            return item;
        });
    }

    /**
     * 设置选中的行
     * @param key 对应行数据的KEY值
     * @param list 要选中的数据值
     */
    setSelectRows(key, list) {
        this.state.data.map((row, i) => {
            if (list.indexOf(row[key]) !== -1) {
                this.refs['row_' + i].setChecked(true);
            }
        });
    }

    bindSplit() {
        if (this.props.move) {
            this.headerSplits.forEach((split) => {
                if (!this.drag) {
                    this.dragColumnLeft = 0;
                    this.dragWidth      = 0;
                    this.drag           = new Drag(this.split, split, {
                        start: (dragDom, eventDom) => {
                            let xy              = GetDomXY(eventDom, this.mainDom);
                            this.dragWidth      = parseInt(eventDom.parentNode.style.width);
                            dragDom.style.left  = xy.left + 'px';
                            this.dragColumnLeft = xy.left;
                            dragDom.classList.remove('d-none');
                            return true;
                        },
                        move : (move, dragDom, eventDom) => {
                            if (this.dragWidth + (move.x - this.dragColumnLeft) < 50) {
                                move.x = this.dragColumnLeft - this.dragWidth + 50;
                            }
                        },
                        end  : (dragDom, eventDom) => {
                            dragDom.classList.add('d-none');
                            let column_key              = eventDom.dataset.key;
                            let diff                    = parseInt(dragDom.style.left) - this.dragColumnLeft;
                            this.width                  = (parseInt(this.width) + diff) + 'px';
                            this.table_head.style.width = this.width;
                            this.table_body.style.width = this.width;
                            document.querySelectorAll(`#${column_key}`).forEach((item) => {
                                item.style.width = `${this.dragWidth + diff}px`;
                            });
                            return true;
                        }
                    });
                } else {
                    this.drag.setEventDom(split);
                }
            });
        }
    }

    getClasses() {
        let base = 'table ck-table';
        //striped
        if (this.props.striped) {
            base = classNames(base, 'table-striped');
        }
        //theme
        if (this.props.theme) {
            base = classNames(base, 'table-' + this.props.theme);
        }
        //bordered
        if (this.props.bordered) {
            base = classNames(base, 'table-bordered');
        }
        //hover
        if (this.props.hover) {
            base = classNames(base, 'table-hover');
        }
        //sm
        if (this.props.sm) {
            base = classNames(base, 'table-sm');
        }
        if (this.props.fontSm) {
            base = classNames(base, 'table-font-sm');
        }
        //responsive
        if (this.props.responsive) {
            base = classNames(base, 'table-responsive');
        }
        //nowrap
        if (this.props.noWrap) {
            base = classNames(base, 'ck-ctable-nowrap');
        }
        return base;
    }

    getMainClasses() {
        let base = 'ck-ctable-main d-flex flex-column';
        if (this.props.bordered) {
            base = classNames(base, 'border');
        }
        return classNames(base, this.props.className);
    }

    getStyles() {
        //default style
        let base = {};
        //width
        if (this.props.width) {
            base.width = this.props.width;
        }
        //height
        if (this.props.height) {
            base.height = this.props.height;
        }

        if (this.props.absolute) {
            base.position = 'absolute';
            base.top      = this.props.y;
            base.left     = this.props.x;
            if (typeof this.props.position === 'object') {
                base.top    = this.props.position.top || this.props.y;
                base.left   = this.props.position.left || this.props.x;
                base.right  = this.props.position.right;
                base.bottom = this.props.position.bottom;
                base.width  = undefined;
                base.height = undefined;
            }
        }

        return common.extend(base, this.props.style)
    }

    getHeaderClasses() {
        let base = 'ck-ctable-header';
        if (this.props.headerTheme) {
            base = 'thead-' + this.props.headerTheme;
        }
        return classNames(base, this.props.headClass);
    }

    getTableStyles() {
        let base = {};

        if (this.width) {
            base.width = this.width;
        }

        return base;
    }

    getBodyClasses() {
        let base = 'ck-ctable-body flex-grow-1 d-flex flex-column';

        return base;
    }

    render() {
        return (
            <div ref={c => this.mainDom = c} className={this.getMainClasses()} style={this.getStyles()}>
                <div className={this.getBodyClasses()}>
                    {this.renderHeader()}
                    {this.renderRows()}
                </div>
                {this.renderFoot()}
                <div ref={c => this.split = c} className='ck-split d-none'/>
            </div>
        );
    }

    renderHeader() {
        return (
            <div ref={c => this.tableHeader = c}>
                <table ref={c => this.table_head = c} id={`table-head-${this.domId}`} className={this.getClasses()} style={this.getTableStyles()}>
                    <thead className={this.getHeaderClasses()}>
                    <tr>
                        {this.state.select ?
                            <th width='20px'><input type='checkbox' onChange={this.selectAll}/>
                            </th> : null}
                        {React.Children.map(this.props.children, (item, key) => {
                            if (!item || item.props.hide) {
                                return null;
                            }
                            let align = item.props.align || this.props.align;
                            let style = {
                                'textAlign': align
                            };
                            if (item.props.width) {
                                style.width = item.props.width;
                            }
                            let sort_icon = 'sort';
                            if (this.sortList[item.props.field]) {
                                sort_icon = 'sort-alpha-' + (this.sortList[item.props.field] === 'asc' ? 'down' : 'up');
                            }
                            return (
                                <th id={this.domId + '-' + key} data-key={'head_' + key} style={style}>
                                    {item.props.onSort ? <a href='javascript://'
                                                            onClick={this.sortHandler(item.props.field, item.props.onSort)}>
                                        {item.props.text}{'\u0020'}
                                        <Icon icon={sort_icon}/></a> : item.props.text}
                                    {this.props.move ?
                                        <span ref={c => this.headerSplits.push(c)} data-key={this.domId + '-' + key} className='ck-column-split'/> : null}
                                </th>
                            );
                        })}
                    </tr>
                    </thead>
                </table>
            </div>
        )
    }

    renderRows() {
        return (
            <div className='flex-grow-1 rows' onScroll={this.scrollHandler}>
                <table ref={c => this.table_body = c} id={`table-body-${this.domId}`} className={this.getClasses()} style={this.getTableStyles()}>
                    <tbody>
                    {this.state.data.map((row, i) => {
                        return this.renderRow(row, i);
                    })}
                    </tbody>
                </table>
            </div>
        )
    }

    renderRow(row, i, parentRow) {
        return (
            <React.Fragment>
                <tr className={this.props.onClick ? 'click-row' : null} onClick={this.clickHandler(row, i)}>
                    {this.state.select ?
                        <th width='20px'><input type='checkbox' ref={'row_' + i} onChange={this.changeHandler(row, i)}/>
                        </th> : null}
                    {React.Children.map(this.props.children, (item, key) => {
                        if (!item || item.props.hide) {
                            return null;
                        }
                        //set style
                        let style = {...this.props.columnStyle};

                        style.textAlign = item.props.align || this.props.align;
                        if (item.props.width) {
                            style.width = item.props.width;
                        }
                        //set tree
                        let tree, parent;
                        if (item.props.tree) {
                            if (parentRow) {
                                parent = <span className='mr-4'/>
                            }
                            tree = <Icon data-open='close' onClick={() => {
                                if (typeof this.props.onClickTree === 'function') {
                                    this.props.onClickTree(row, (data) => {
                                        if (!data) {
                                            return
                                        }
                                        let tree        = this.state.tree;
                                        tree[i]         = data;
                                        this.state.tree = null;
                                        this.setState({
                                            tree: tree
                                        })
                                    });
                                }

                            }} className='mr-1 text-primary' icon='plus-square' iconType='regular'/>
                        }

                        if (item.props.children) {
                            return (
                                <td id={this.domId + '-' + key} className={item.props.className} style={{'text-align': align}} key={'col_' + key}>{parent}{tree}{React.cloneElement(item, {
                                    text : item.props.text,
                                    row  : row,
                                    value: row[item.props.field]
                                })}</td>
                            );
                        } else {
                            return <td id={this.domId + '-' + key} style={style} key={'col_' + key}>{parent}{tree}{item.props.onFormat ? item.props.onFormat(row[item.props.field], row) : row[item.props.field]}</td>;
                        }
                    })}
                </tr>
                {this.props.tree ? this.renderTreeRow(row, i) : null}
            </React.Fragment>
        );
    }

    renderFoot() {
        if (!this.props.foot) {
            return null;
        }
        return (
            <div>
                <Pagination current={this.state.page} count={this.state.dataCount} size='sm'
                            onSelect={this.selectPageHandler}
                            number={this.props.showNumbers}
                            showPages={this.props.showPages}/>
            </div>
        )
    }
}

CTable.propTypes = {
    theme       : PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']),
    headerTheme : PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']),
    headClass   : PropTypes.string,
    data        : PropTypes.array,
    dataCount   : PropTypes.number,
    page        : PropTypes.number,
    select      : PropTypes.bool,
    header      : PropTypes.bool,
    center      : PropTypes.bool,
    currentPage : PropTypes.number,
    striped     : PropTypes.bool,
    bordered    : PropTypes.bool,
    hover       : PropTypes.bool,
    sm          : PropTypes.bool,
    fontSm      : PropTypes.bool,
    responsive  : PropTypes.bool,
    align       : PropTypes.string,
    tree        : PropTypes.string,
    onClickTree : PropTypes.func,
    onClick     : PropTypes.func,
    onCheck     : PropTypes.func,
    move        : PropTypes.bool,
    onRefresh   : PropTypes.func,
    refreshText : PropTypes.string,
    absolute    : PropTypes.bool,
    x           : PropTypes.string,
    y           : PropTypes.string,
    width       : PropTypes.string,
    height      : PropTypes.string,
    foot        : PropTypes.bool,
    position    : PropTypes.object,
    showPages   : PropTypes.number,
    showNumbers : PropTypes.number,
    onSelectPage: PropTypes.func,
    noWrap      : PropTypes.bool
};

CTable.defaultProps = {
    data       : [],
    dataCount  : 1,
    select     : true,
    header     : true,
    foot       : true,
    currentPage: 1,
    hover      : true,
    striped    : true,
    align      : 'left',
    sm         : true,
    fontSm     : true,
    headerTheme: 'light',
    noWrap     : true,
    bordered   : true,
    move       : true
};

export default CTable;