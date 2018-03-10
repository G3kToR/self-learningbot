var Bot_ns = (function () {
    /* Функция сохраняет значение в локалсторедже */
    function saveLocalData(key,value) {
        try {
            localStorage.setItem(key, value);
        } catch (err) {
            if (err == QUOTA_EXCEEDED_ERR) {
                console.log('Ошибка ' + err.name + ":" + err.message + "\n" + err.stack);
                new Message(0,'Превышен лимит памяти :(').addInDOM();
            }
        }
    }

    /* Объект с информацией о пользователе */
    var userObj = {
        getName: function() {
            return (this.checkUserName() && this.name.length > 0) ? this.name : 'Аноним';
        },
        get name() {
            return localStorage.getItem('userName');
        },
        set name(value) {
            saveLocalData('userName',value);
        },
        checkUserName:  function () {
            if (this.name != null || this.name != undefined) return true;
            else return false;
        }
    };

    /* Класс формы ввода */
    function Form() {
        this.formType = 0;
        this.placeholder = [
            'Задайте боту вопрос...',
            'Введите ответ на вопрос или "Отмена"',
            'Введите свое имя'
        ];
    }
    Form.prototype.setPlaceholder = function (type) { // Устанавливает определенный пласехолдер
        var $form__input = document.getElementsByClassName('form__input')[0];
        $form__input.setAttribute('placeholder',this.placeholder[type]);
        if (type == 0) $form__input.classList.remove('form__input_warning');
        else $form__input.classList.add('form__input_warning');
        $form__input = null;
    };
    Form.prototype.onSend = function () { // Оброботчик события на отправку
        var $form__input = document.getElementsByClassName('form__input')[0];
        var text = $form__input.value;
        if (text.length == 0) return '';
        text = text.trim().replace(/<[^>]*?script[^>]*?>/gi, "")
            .replace(/<[^>]*?js:[^>]*?>/gi, "")
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\s{2,}/g," ");
        $form__input.value = '';
        $form__input = null;
        return text;
    };
    Form.prototype.setType = function (type,callback) {
        document.getElementsByClassName('form')[0].onsubmit = function(e){
            e.preventDefault();
            return callback();
        }
        this.formType = type;
        this.setPlaceholder(type);
    };

    /* Класс для создания и вставки UI сообщений */
    function Message(authorType,text) { // Конструктор шаблона сообщений
        this.authorType = authorType;
        this.text = text;
        this.message = null;
        return this.createMessage();
    }
    Message.prototype.createMessage = function () { // Создает шаблон сообщения

        var author = this.author();

        var $message = document.createElement('div');
        $message.className = 'message';
        var message_type = (this.authorType == 0) ? 'message_bot' : 'message_user';
        $message.classList.add(message_type);

        var $author_ava = document.createElement('span');
        $author_ava.className = 'author-ava';
        $author_ava.innerText = author.ava;

        var $author_name = document.createElement('span');
        $author_name.className = 'author-name';
        $author_name.innerText = author.name;

        var $message__date = document.createElement('span');
        $message__date.className = 'message__date';
        $message__date.innerText = '';

        var $message__text = document.createElement('p');
        $message__text.className = 'message__text';
        $message__text.innerText = this.text;

        $message.appendChild($author_ava);
        $message.appendChild($author_name);
        $message.appendChild($message__date);
        $message.appendChild($message__text);

        this.message = $message;
        $message = null; author = null;
    };
    Message.prototype.author = function () { // Возвращает объект с информацией об авторе
        return {
            type: this.authorType,
            ava: (this.authorType == 0) ? 'Бот' : 'Вы',
            name: (this.authorType == 0) ? 'Бот МАРТЫН' : userObj.getName()
        }
    };
    Message.prototype.messageDate = function (date) { // Возвращает дату сообщения
        var now = parseInt(new Date().getTime());
        var result = new Date(parseInt(date));
        var minutes = ((result.getMinutes() < 10) ? '0'+result.getMinutes() : result.getMinutes());
        if (now - date < 86400000 ) return 'в '+result.getHours()+":"+minutes; //86400000
        else if ((now - date > 86400000) && (now - date < 86400000*2))
            return 'вчера в '+result.getHours()+":"+minutes;
        else
            return ((result.getDate() < 10) ? '0'+result.getDate() : result.getDate())+
                '.'+('0' + (result.getMonth() + 1))+' в '+result.getHours()+":"+minutes;
    };
    Message.prototype.addInDOM = function () { // Вставляет сообщение в DOM
        var $chat = document.getElementsByClassName('chat')[0];
        var $message__date = this.message.getElementsByClassName('message__date')[0];
        $message__date.innerText = this.messageDate(new Date().getTime()); // Дата сообщения
        $chat.insertBefore(this.message, $chat.firstChild);
        $message__date = null;
        $chat = null;
    };

    /* Класс для хранения вопросов бота */
    function BotQuestions() { // Конструктор
    }
    BotQuestions.prototype.randQuest = function (length) { // Возвращает рандомный номер вопроса бота
        return Math.floor(Math.random() * length);
    };
    BotQuestions.prototype.getHelloQuest = function () { // Возвращает вопрос при знакомстве
        var helloQuests = [
            'Привет! Давай знакомиться, как тебя зовут?',
            'Привет, {name}! Что хочешь спросить?'
        ];
        return ((userObj.checkUserName())
                ? helloQuests[1].replace('{name}', userObj.name)
                : helloQuests[0]
        );
    };
    BotQuestions.prototype.getWaitQuest = function () { // Возвращает рандомный вопрос ожидания
        var waitQuests = [
            'Задавай вопрос, я же жду :)',
            'Спроси, что хотел давно спросить...',
            'Я жду вопроса ;)',
            'Давай поговорим, задай вопрос)',
            'Спроси меня о чем-нибудь...',
            'Есть вопрос? Задавай!',
            'Ну же, давай поговорим, задай вопрос...'
        ];
        return waitQuests[this.randQuest(waitQuests.length)];
    };
    BotQuestions.prototype.getAnsQuest = function () { // Возвращает рандомный вопрос ожидания
        var ansQuests = [
            'Я не знаю ответа на этот вопрос, помоги мне. Напиши ответ, пожалуйста.',
            'Похоже это незнакомый для меня вопрос, пришли ответ, если найдешь :)',
            'Кажется я не знаю ответа на этот вопрос. Скажи ответ...',
            'Помоги мне научиться, скажи ответ на этот вопрос :)'
        ];
        return ansQuests[this.randQuest(ansQuests.length)];
    };
    BotQuestions.prototype.getThankAsk = function () { // Возвращает рандомный ответ на обучение
        var thankAns = [
            'Спасибо, я стал умнее. Можешь спросить что-нибудь еще)',
            'Ты сделал меня чуточку лучше! Есть еще вопрос?',
            'Еее, я поумнел)))'
        ];
        return thankAns[this.randQuest(thankAns.length)];
    };

    /* Класс для работы с памятью бота */
    function Memory() {
        this.memory = [];
        this.loadMem();
    }
    Memory.prototype.loadMem = function () { // Загрузка данных из локалсторадж
        try {
            var memory = localStorage.getItem('memory');
            this.memory = (memory == null) ? [] : JSON.parse(memory);
        } catch (err) {
            this.getError(err);
        }
    };
    Memory.prototype.getMem = function () { // Получение данных из памяти
        return this.memory;
    };
    Memory.prototype.putInMem = function (val) { // Загрузка данных в память
        try {
            this.memory.push(val);
            saveLocalData('memory',JSON.stringify(this.memory));
        } catch (err) {
            this.getError(err);
        }
    };
    Memory.prototype.getError = function (err) { // Вызывает сообщение об ошибке
        console.log('Ошибка ' + err.name + ":" + err.message + "\n" + err.stack);
        new Message(0, 'Ой, похоже что-то с памятью, нужно меня перезагрузить. Если не поможет напиши: "сброс".').addInDOM();
    };

    /* Класс мозга бота  */
    function BotBrain() {
        this.form = new Form(); // Объект формы ввода
        this.memory = new Memory(); // Подключаем память
        this.cacheQuest = '';
        this.onStart();
    }
    BotBrain.prototype.onStart = function () { // Начало общения
        (userObj.checkUserName()) ? this.setTypeForm(0) : this.setTypeForm(2); // Установка типа формы от имени бота
        new Message(0,new BotQuestions().getHelloQuest()).addInDOM(); // Здоровается
    };
    BotBrain.prototype.setTypeForm = function (type) {  // Устанавливает типа формы от имени бота
        if (type == 0) {
            this.form.setType(0,this.onSend_quest.bind(this)); // Запускает режим ожидания вопроса
            this.startWaitQuests(); // Запускает ожидающие вопросы каждые 5 секунд
        } else if (type == 1) {
            this.form.setType(1,this.onSend_ask.bind(this)); // Запускает режим знакомства
            new Message(0,new BotQuestions().getAnsQuest()).addInDOM();
        } else if (type == 2) {
            this.form.setType(2,this.onSend_hello.bind(this)); // Запускает режим знакомства
        }
    };
    BotBrain.prototype.startWaitQuests = function () { // Запускает вопросы каждые 5 секунд
        var $form__input = document.getElementsByClassName('form__input')[0];
        var timerId = setTimeout(function tick() {
            new Message(0,new BotQuestions().getWaitQuest()).addInDOM();
            timerId = setTimeout(tick, 5000);
        }, 5000);
        $form__input.onblur = function() { // Запускает сообщения бота когда юзер убрал фокус
            timerId = setTimeout(function tick() {
                new Message(0,new BotQuestions().getWaitQuest()).addInDOM();
                timerId = setTimeout(tick, 5000);
            }, 5000);
        };
        $form__input.onfocus = function() { // Останавливает сообщения бота пока юзер пишет
            clearTimeout(timerId);
        };
    };
    BotBrain.prototype.clearText = function (text) {
        return text.toLowerCase() // Форматирование строки (удаление знаков препинания и в нижний регистр)
            .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g, "");
    };
    BotBrain.prototype.mathExp = function (text) { // Считает математические выражения
        try {
            text = text.replace(/[^-+*/%()0-9]/g, '');
            return new Message(0, text + ' = ' + eval(' (' + text + ') ')).addInDOM();
        } catch (e) {
            return new Message(0, 'Ошибка в выражении, повнимательней!').addInDOM();
        }
    };
    BotBrain.prototype.throwCoin = function () { // Подбрасывает монетку
        var res = (Math.floor(Math.random() * 2) == 0) ? 'орел' : 'решка';
        return new Message(0,res).addInDOM();
    };
    BotBrain.prototype.resetBot = function () { // Сброс памяти бота
        localStorage.clear();
        location.href=location.href;
    };
    BotBrain.prototype.findAnsQuest = function (text) {
        this.cacheQuest = text; // Сохраняем последний тест вопроса
        var word_arr = text.split(' '); // Разбиваем сообщение юзера в массив
        var archive = this.memory.getMem(); // Берем данные из памяти

        var answerArr = []; // массив предпологаемых ответов
        archive.forEach(function(itemAr, iAr) { // Проходимся по архиву вопросов
            var colTwin = 0; // Количесво совпадений
            // Проходимся по словам текущего вопроса и ищем кол-во вхождения слов
            word_arr.forEach(function(item, i) {
                if ((itemAr.quest.match(new RegExp("(^|\\s)"+item+"(\\s|$)", "g")) || []).length > 0) colTwin++;
            });
            // Если процент совпадений слов больше 25 помещаем в массив предпологаемых ответов
            if ((100*colTwin/(word_arr.length) > 25))
                answerArr.push([itemAr.answer,itemAr.colWord,colTwin]); // Если хоть одно слово совподает заносим в массив
        });

        /*// Эксперемент: поиск в ответах
        if (answerArr.length == 0)
        archive.forEach(function(itemAr, iAr) { // Проходимся по архиву вопросов
            var colTwin = 0; // Количесво совпадений
            // Проходимся по словам текущего вопроса и ищем кол-во вхождения слов
            word_arr.forEach(function(item, i) {
                if ((itemAr.answer.match(new RegExp("(^|\\s)"+item+"(\\s|$)", "g")) || []).length > 0) colTwin++;
            });
            // Если процент совпадений слов больше 25 помещаем в массив предпологаемых ответов
            if ((100*colTwin/(word_arr.length) > 25))
                answerArr.push([itemAr.quest,itemAr.colWord,colTwin]); // Если хоть одно слово совподает заносим в массив
        });*/

        if (answerArr.length == 0) return this.setTypeForm(1);  // Установка типа формы на слуш. ответ

        // Обрабатываем выборку из предыдущего шага. Находим вопрос с максимальным совпадением.
        var result = ['',0,0]; // [ответ,кол-во слов в вопроск,кол-во совпадений слов]
        answerArr.forEach(function(item, i) {
            var this_proc = (100*item[2]/item[1]);
            if (this_proc > 25 && this_proc >= result[1] && item[2] >= result[2]) {
                result = [item[0],this_proc,item[2]];
            }
        });
        if (result[0].length == 0) return this.setTypeForm(1); // Если нет ответа режим ответа

        new Message(0,result[0]).addInDOM(); // Выводим результат
        archive = null; answerArr = null;
    };
    BotBrain.prototype.onSend_hello = function () { // Колбэк при отправки формы знакомства
        var text = this.form.onSend();
        userObj.name = text;
        new Message(1,text).addInDOM();
        new Message(0,'Приятно познакомиться. Задавай вопрос)').addInDOM();
        this.setTypeForm(0); // Установка типа формы на слуш. вопроса
    };
    BotBrain.prototype.onSend_quest = function () { // Колбэк при отправки формы задания вопроса
        var text = this.form.onSend(); // Получаем текс сообщения от формы
        new Message(1,text).addInDOM(); // Вывод введенного сообщения пользователем

        // Перехватывает и обрабатывает математические операции
        if (/(?:\d+\s*[*+%/-]\s*)+\d+/g.test(text))
            return this.mathExp(text);

        text = this.clearText(text); // Удаляем знаки препинания и в нижний регистр

        // Отслеживание команды на бросок монетки
        if (text.indexOf('монетку') > -1) return this.throwCoin();

        // Сброс архива
        if (text == 'сброс') return this.resetBot();

        // Правка ответа
        if (text == 'нет') return this.setTypeForm(1); // Устанавливаем форму в слуш. вопроса

        // Ищем ответ на вопрос
        return this.findAnsQuest(text);
    };
    BotBrain.prototype.onSend_ask = function () { // Колбэк при отправки формы ответа на заданный вопрос
        var text = this.form.onSend(); // Получаем текс сообщения от формы
        new Message(1,text).addInDOM(); // Вывод введенного сообщения пользователем
        text = this.clearText(text); // Удаляем знаки препинания и в нижний регистр
        if (text == 'отмена') return this.setTypeForm(0); // Устанавливаем форму в слуш. вопроса
        var quest = this.cacheQuest; // Вопрос заданный пользователем

        // Удаляем лишние слова из вопроса
        var questWords = ['кто','что','где','когда','тако.*?\\s','из','чего','сколько','как'];
        questWords.forEach(function (item,i) {
            quest = quest.replace(new RegExp(item, "g"),'');
        });
        quest = quest.trim();

        // Загружаем ответ в память
        this.memory.putInMem({colWord: quest.split(" ").length, quest: quest, answer: text});
        new Message(0,new BotQuestions().getThankAsk()).addInDOM();
        this.setTypeForm(0); // Устанавливаем форму в слуш. вопроса
        questWords = null;
    };

    // Экспортируем методы модуля
    return {
        BotBrain: BotBrain
    }
})();