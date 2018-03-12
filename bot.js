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


    /* Класс мозга бота  */
    function BotBrain() {
        this.form = new Form(); // Объект формы ввода
        this.memory = new BotMemory();
        this.onStart();
    }
    BotBrain.prototype.onStart = function () { // Начало общения
        (userObj.checkUserName()) ? this.setTypeForm(0) : this.setTypeForm(2); // Установка типа формы от имени бота
        new Message(0,new BotQuestions().getHelloQuest()).addInDOM(); // Здоровается
    };
    BotBrain.prototype.setTypeForm = function (type) {  // Устанавливает типа формы от имени бота
        if (type == 0) {
            this.form.setType(0,this.onSend_quest.bind(this)); // Запускает режим ожидания вопроса
//!!!!!!!!!this.startWaitQuests(); // Запускает ожидающие вопросы каждые 5 секунд
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
    BotBrain.prototype.findAnsQuest = function (text) { // Ищем ответ на вопрос в памяти
        var answer = this.memory.setQuery(text);
        if (answer.length == 0) return this.setTypeForm(1);  // Установка типа формы на слуш. ответ
        new Message(0,answer).addInDOM(); // Выводим результат
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

        // Загружаем ответ в память
        this.memory.saveAnsQuery(text);
        new Message(0,new BotQuestions().getThankAsk()).addInDOM();
        this.setTypeForm(0); // Устанавливаем форму в слуш. вопроса
    };

    /* Класс для работы с памятью бота (ИИ) */
    function BotMemory() {
        this.query = '';
        this.newWords = null;
        this.words = null;
        this.assocs = null;
        this.net = null;
        this.unNormQueryVec = null; // номера слов из словаря
        this.normQueryVec = null; // 0 и 1
        this.loadMemory();
    }
    BotMemory.prototype.loadMemory = function () { // Загрузка памяти из локалсторедж
        try {
            var memory = localStorage.getItem('memory');
            if (memory == null) {
                this.words = [];
                this.assocs = [];
            } else {
                memory = JSON.parse(memory);
                this.words = memory.words;
                this.assocs = memory.assocs;
                if (memory.net != null) {
                    var net = new brain.NeuralNetwork();
                    this.net = net.fromJSON(memory.net);
                }
            }
        } catch (err) {
            this.getError(err);
        }
    };
    BotMemory.prototype.setQuery = function (query) { // Сохранение запроса
        this.query = this.clearQuery(query);
        this.getUnNormQueryVec();
        this.getNormQueryVec();
        if (this.words.length == 0) return '';
        var answer = this.findAnsQuery(); // Ищем ответ на вопрос
        return (!answer) ? '': answer;
    };
    BotMemory.prototype.clearQuery = function (text) {
        var delWords = ['в','на','под','с','и','над'];
        for (var i = 0; i != delWords.length; i++) {
            text = text.replace(new RegExp("(^|\\s)"+delWords[i]+"($|\\s)", "ig"),function(str, offset) {
                return str.substr(offset+str.length-1);
            });
        }
        return text.trim();
    };
    BotMemory.prototype.getUnNormQueryVec = function () { // Получение запроса из цифр
        var word_arr = this.query.split(' ');
        var word_str = word_arr.join('|');
        //var unigram = this.Stemming();
        var result = [];
        for (var i = 0; i != this.words.length; i++) {
            var word = this.words[i];
            if ((word.match(new RegExp("(^|\\s)("+word_str+")($|\\s)", "ig")) || []).length > 0) {
                result.push(i);
                var ind = word_arr.indexOf(word);
                if (ind > -1) word_arr.splice(ind,1);
            }
        }
        //console.log('new', word_arr);
        //console.log('Unnorm ',result);
        this.newWords = word_arr;
        this.unNormQueryVec = result;
        if (result.length == 0) return false;
    };
    BotMemory.prototype.getNormQueryVec = function () { // Получение вектора из предложения в цифровом виде
        var result = [];
        var _this = this;
        this.unNormQueryVec.forEach(function (item) {
            var itemVec = [];
            for (var i = 0; i!= _this.words.length; i++) {
                if (i == item) itemVec.push(1);
                else itemVec.push(0);
            }
            result = _this.sumVectors(itemVec,result);
        });
        this.normQueryVec = result;
        return result;
    };
    BotMemory.prototype.getNormWordVec = function (id) { // Создает вектор слова
        var result = [];
        for (var i = 0; i != this.words.length; i++){
            if (i == id) result.push(1);
            else result.push(0);
        }
        return result;
    };
    /*BotMemory.prototype.Stemming = function () { // Удаление окончаний у не нужных слов
        var word_arr = this.query.split(' ');
        var delWords = 'кто что где когда как сколько скольких чего из такой такая таких';
        var regexp = /[цкнгшщзхфвпрлджчсмтб]/ig;
        return word_arr.map(function (item) {
            if (item.length == 1) return item.substring(0, i+1);
            if ((delWords.match(new RegExp("(^|\\s)("+item+")($|\\s)", "ig")) || []).length > 0)
            for (var i = item.length-1; i != 0; i--) {
                if (item[i].search(regexp) > -1) {
                    console.log(item.substring(0, i + 1), ' ', i);
                    return item.substring(0, i + 1);
                    break;
                }
            }
            else return item;
        });
    };*/
    BotMemory.prototype.setArrayLength = function (array,length) { // Задача массива нужной длинны
        if (array.length > length) {
            array.length = length;
            return array;
        }
        for (var i = array.length; i != length;  i++)  array.push(0);
        return array;
    };
    BotMemory.prototype.sumVectors = function (arr1,arr2) { // Сложение векторов
        return arr1.map(function (item, i) {
            if (arr1[i] == undefined) arr1[i] = 0;
            if (arr2[i] == undefined) arr2[i] = 0;
            if (item == 1 && arr2[i] == 1) return 1;
            else return item+arr2[i];
        });
    };
    BotMemory.prototype.trainObj = function () { // Создание объекта для треннировки сетки
        if (this.assocs.length == 0) return false;
        var _this = this;
        return this.assocs.map(function (item, i) {
            return {
                input: _this.setArrayLength(item[0],_this.words.length),
                output: _this.setArrayLength(item[1],_this.words.length)
            };
        });
    };
    //BotMemory.prototype.loadNet
    BotMemory.prototype.trainNN = function () { // Треннировка сети
        if (this.assocs.length == 0) return false;
        var net = new brain.NeuralNetwork();
        net.train(this.trainObj());
        this.net = net;
    };
    BotMemory.prototype.findAnsQuery = function () { // Ищет ответ на запрос с помощью сети
        /*if (this.net == null && this.words.length > 0 && this.assocs.length > 0) this.trainNN();
        else return false;*/
        var output = this.net.run(this.normQueryVec);
        console.log(output);
        var maxOut = [0,0];
        output = output.map(function (item,i) {
            if (item > maxOut[0]) maxOut = [item,i];
            return (item > 0.5) ? 1 : 0;
        });

        var wordId = output.indexOf(1);
        var answer;
        if (wordId > -1) answer = this.words[wordId];
        else {
            if (maxOut[0] > 0.25) answer = this.words[maxOut[1]];
            else answer = false;
        }
        return answer;
    };
    BotMemory.prototype.saveAnsQuery = function (answer) {
        if (this.newWords != null && this.newWords.length > 0)
            for (var i = 0; i != this.newWords.length; i++) { // Добавляем неизвестные слова из вопроса в словарь
                this.words.push(this.newWords[i]);
                var wordInd = this.words.length-1;
                this.normQueryVec = this.sumVectors(this.getNormWordVec(wordInd),this.normQueryVec);
            }
        var ansInd = null;
        if (this.words.length > 0)
            for (var i = 0; i != this.words.length; i++) { // Ищем ответ в словаре
                if ((this.words[i].match(new RegExp("(^|\\s)"+answer+"($|\\s)", "ig")) || []).length > 0) {
                    ansInd = i;
                    break;
                }
            }
        if (ansInd == null) { // Если такого ответа нет, добовляем в словарь
            this.words.push(answer);
            var ansInd = this.words.length-1;
        }
        var normAnsVec = this.getNormWordVec(ansInd); // Получаем нормальный вектор ответа
        this.assocs.push([this.normQueryVec,normAnsVec]); // Заносим во временную память
        this.trainNN(); // Треннируем сеть
        this.putInMemory(); // Сохраняем в кэш (локалсторедж)
    };
    BotMemory.prototype.putInMemory = function () { // Загрузка данных в память
        try {
            var memory = {};
            memory.words = this.words;
            memory.assocs = this.assocs;
            memory.net = this.net.toJSON();
            saveLocalData('memory',JSON.stringify(memory));
        } catch (err) {
            this.getError(err);
        }
    };
    BotMemory.prototype.getError = function (err) { // Вызывает сообщение об ошибке
        console.log('Ошибка ' + err.name + ":" + err.message + "\n" + err.stack);
        new Message(0, 'Ой, похоже что-то с памятью, нужно меня перезагрузить. Если не поможет напиши: "сброс".').addInDOM();
    };

    // Экспортируем методы модуля
    return {
        BotBrain: BotBrain
    }
})();