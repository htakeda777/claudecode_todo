import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { TodoApp } from './todo.js';

// localStorage のモック
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

global.localStorage = localStorageMock;

// alert と confirm のモック
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

describe('TodoApp', () => {
    let app;
    let mockTodoInput;
    let mockTodoList;
    let mockStatsText;

    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();

        // DOM要素のモック
        document.body.innerHTML = `
            <input id="todoInput" />
            <button id="addBtn">追加</button>
            <ul id="todoList"></ul>
            <span id="statsText"></span>
            <button class="filter-btn active" data-filter="all">すべて</button>
            <button class="filter-btn" data-filter="active">未完了</button>
            <button class="filter-btn" data-filter="completed">完了</button>
        `;

        app = new TodoApp();
    });

    describe('初期化', () => {
        test('空のtodoリストで初期化される', () => {
            expect(app.todos).toEqual([]);
        });

        test('currentFilterが"all"で初期化される', () => {
            expect(app.currentFilter).toBe('all');
        });

        test('localStorageから既存のtodoを読み込む', () => {
            const existingTodos = [
                { id: 1, text: 'テスト', completed: false, createdAt: new Date().toISOString() }
            ];
            localStorage.setItem('todos', JSON.stringify(existingTodos));

            const newApp = new TodoApp();
            expect(newApp.todos).toEqual(existingTodos);
        });
    });

    describe('addTodo', () => {
        beforeEach(() => {
            app.init();
            app.todoInput = document.getElementById('todoInput');
            app.todoList = document.getElementById('todoList');
            app.statsText = document.getElementById('statsText');
        });

        test('新しいtodoを追加できる', () => {
            app.todoInput.value = '新しいタスク';
            app.addTodo();

            expect(app.todos.length).toBe(1);
            expect(app.todos[0].text).toBe('新しいタスク');
            expect(app.todos[0].completed).toBe(false);
        });

        test('空の入力でtodoを追加しようとするとアラートが表示される', () => {
            app.todoInput.value = '   ';
            app.addTodo();

            expect(alert).toHaveBeenCalledWith('タスクを入力してください');
            expect(app.todos.length).toBe(0);
        });

        test('todoを追加後に入力フィールドがクリアされる', () => {
            app.todoInput.value = '新しいタスク';
            app.addTodo();

            expect(app.todoInput.value).toBe('');
        });

        test('todoが追加されるとlocalStorageに保存される', () => {
            app.todoInput.value = '新しいタスク';
            app.addTodo();

            const saved = JSON.parse(localStorage.getItem('todos'));
            expect(saved.length).toBe(1);
            expect(saved[0].text).toBe('新しいタスク');
        });
    });

    describe('toggleTodo', () => {
        beforeEach(() => {
            app.init();
            app.todoInput = document.getElementById('todoInput');
            app.todoList = document.getElementById('todoList');
            app.statsText = document.getElementById('statsText');

            app.todoInput.value = 'テストタスク';
            app.addTodo();
        });

        test('todoの完了状態を切り替えられる', () => {
            const todoId = app.todos[0].id;

            app.toggleTodo(todoId);
            expect(app.todos[0].completed).toBe(true);

            app.toggleTodo(todoId);
            expect(app.todos[0].completed).toBe(false);
        });

        test('存在しないIDでは何も起こらない', () => {
            const initialState = [...app.todos];
            app.toggleTodo(999999);
            expect(app.todos).toEqual(initialState);
        });
    });

    describe('deleteTodo', () => {
        beforeEach(() => {
            app.init();
            app.todoInput = document.getElementById('todoInput');
            app.todoList = document.getElementById('todoList');
            app.statsText = document.getElementById('statsText');

            app.todoInput.value = 'テストタスク';
            app.addTodo();
        });

        test('todoを削除できる', () => {
            const todoId = app.todos[0].id;

            app.deleteTodo(todoId);
            expect(app.todos.length).toBe(0);
            expect(confirm).toHaveBeenCalledWith('このタスクを削除しますか？');
        });

        test('confirmでキャンセルした場合は削除されない', () => {
            global.confirm = jest.fn(() => false);
            const todoId = app.todos[0].id;

            app.deleteTodo(todoId);
            expect(app.todos.length).toBe(1);
        });
    });

    describe('getFilteredTodos', () => {
        beforeEach(() => {
            app.todos = [
                { id: 1, text: 'タスク1', completed: false, createdAt: new Date().toISOString() },
                { id: 2, text: 'タスク2', completed: true, createdAt: new Date().toISOString() },
                { id: 3, text: 'タスク3', completed: false, createdAt: new Date().toISOString() }
            ];
        });

        test('すべてのtodoを返す（all）', () => {
            app.currentFilter = 'all';
            const filtered = app.getFilteredTodos();
            expect(filtered.length).toBe(3);
        });

        test('未完了のtodoのみを返す（active）', () => {
            app.currentFilter = 'active';
            const filtered = app.getFilteredTodos();
            expect(filtered.length).toBe(2);
            expect(filtered.every(t => !t.completed)).toBe(true);
        });

        test('完了したtodoのみを返す（completed）', () => {
            app.currentFilter = 'completed';
            const filtered = app.getFilteredTodos();
            expect(filtered.length).toBe(1);
            expect(filtered.every(t => t.completed)).toBe(true);
        });
    });

    describe('updateStats', () => {
        beforeEach(() => {
            app.init();
            app.statsText = document.getElementById('statsText');
        });

        test('todoがない場合のメッセージを表示', () => {
            app.todos = [];
            app.updateStats();
            expect(app.statsText.textContent).toBe('タスクがありません');
        });

        test('正しい統計情報を表示', () => {
            app.todos = [
                { id: 1, text: 'タスク1', completed: false, createdAt: new Date().toISOString() },
                { id: 2, text: 'タスク2', completed: true, createdAt: new Date().toISOString() },
                { id: 3, text: 'タスク3', completed: false, createdAt: new Date().toISOString() }
            ];
            app.updateStats();
            expect(app.statsText.textContent).toBe('全3件 | 未完了: 2件 | 完了: 1件');
        });
    });

    describe('escapeHtml', () => {
        beforeEach(() => {
            app.init();
        });

        test('HTMLタグをエスケープする', () => {
            const escaped = app.escapeHtml('<script>alert("XSS")</script>');
            expect(escaped).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
        });

        test('通常のテキストはそのまま返す', () => {
            const escaped = app.escapeHtml('普通のテキスト');
            expect(escaped).toBe('普通のテキスト');
        });
    });

    describe('localStorage連携', () => {
        beforeEach(() => {
            app.init();
            app.todoInput = document.getElementById('todoInput');
            app.todoList = document.getElementById('todoList');
            app.statsText = document.getElementById('statsText');
        });

        test('saveTodosがlocalStorageに保存する', () => {
            app.todos = [
                { id: 1, text: 'テスト', completed: false, createdAt: new Date().toISOString() }
            ];
            app.saveTodos();

            const saved = JSON.parse(localStorage.getItem('todos'));
            expect(saved).toEqual(app.todos);
        });

        test('loadTodosがlocalStorageから読み込む', () => {
            const testTodos = [
                { id: 1, text: 'テスト', completed: false, createdAt: new Date().toISOString() }
            ];
            localStorage.setItem('todos', JSON.stringify(testTodos));

            const loaded = app.loadTodos();
            expect(loaded).toEqual(testTodos);
        });

        test('localStorageが空の場合は空配列を返す', () => {
            localStorage.clear();
            const loaded = app.loadTodos();
            expect(loaded).toEqual([]);
        });
    });
});
