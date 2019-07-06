import React, {Component} from "react";
import {withRouter} from "react-router-dom";
import {connect} from "react-redux";
import {addScoreTime} from '../../store/actions/exercises';
import "../../css/MCQPlayer.css"
import {SUBMIT_QUESTION, NEXT_QUESTION, FINISH_EXERCISE} from "../translation";
import {FormattedMessage} from 'react-intl';
import meSpeak from 'mespeak';
import withMultimedia from '../../components/WithMultimedia';

class MCQPlayer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            id: -1,
            title: '',
            questions: [],
            noOfQuestions: 1,
            currentQuestionNo: 1,
            submitted: false,
            selected: false,
            selectedAns: '',
            scores: [],
            times: [],
            currentTime: 0,
            intervalID: -1,
            goBackToEdit: false,
            currentScore: 0,
            finish: false,
            userLanguage: '',
            currentQuestion: {
                id: 1,
                question: {
                    type: '',
                    data: ''
                },
                options: [] ,
                correctAns: {type: '', data: ''}
            }
        }

        this.multimedia = {
            text: 'text',
            image: 'image',
            audio: 'audio',
            textToSpeech: 'text-to-speech',
            video: 'video'
        };
    }

    // load the exercise from props
    componentDidMount() {
        if (this.props.location.state) {
            let intervalId = setInterval(this.timer, 1000);
            const {id, title, questions, scores, times, userLanguage} = this.props.location.state.exercise;
            const currentQuestion = questions[0];

            let finish = false;
            if (questions.length === 1) finish = true;

            let goBackToEdit = false;
            if (this.props.location.state.edit) goBackToEdit = true;

            let options = currentQuestion.options.slice();
            this.shuffleArray(options);

            this.setState({
                ...this.state,
                id: id,
                title: title,
                questions: questions,
                noOfQuestions: questions.length,
                intervalID: intervalId,
                scores: scores,
                times: times,
                finish: finish,
                goBackToEdit: goBackToEdit,
                userLanguage: userLanguage,
                currentQuestion: {
                    id: currentQuestion.id,
                    question: currentQuestion.question,
                    options: options,
                    correctAns: currentQuestion.correctAns
                }
            }, () => {
                if(userLanguage.startsWith('en'))
                    meSpeak.loadVoice(require(`mespeak/voices/en/${this.state.userLanguage}.json`));
                else
                    meSpeak.loadVoice(require(`mespeak/voices/${this.state.userLanguage}.json`));
            })
        }
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalID);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // eslint-disable-line no-param-reassign
        }
    }

    choiceSelected = choice => {
        if (!this.state.submitted) {
            this.setState({
                selectedAns: choice,
                selected: true
            })
        }
    };

    // to measure time
    timer = () => {
        this.setState({currentTime: this.state.currentTime + 1});
    };

    // submit the exercise ( calculate score and time ) show correct/ wrong ans
    submitQuestion = () => {
        const {currentScore, selectedAns, currentQuestion} = this.state;
        const {correctAns} = currentQuestion;
        let score = currentScore;
        if (selectedAns === correctAns.data) score = score + 1;
        this.setState({
            selected: false,
            submitted: true,
            currentScore: score
        })
    };

    // move to next question
    nextQuestion = () => {
        const {currentQuestionNo, questions} = this.state;
        let nextQuestionNo = currentQuestionNo + 1;
        if (nextQuestionNo > questions.length) {
            this.finishExercise();
        } else {
            const nextQuestion = questions[nextQuestionNo - 1];
            let options = nextQuestion.options;
            this.shuffleArray(options);
            let finish = false;
            if (nextQuestionNo === questions.length) finish = true;
            this.setState({
                ...this.state,
                currentQuestionNo: nextQuestionNo,
                submitted: false,
                selected: false,
                selectedAns: '',
                finish: finish,
                currentQuestion: {
                    id: nextQuestion.id,
                    question: nextQuestion.question,
                    options: options,
                    correctAns: nextQuestion.correctAns
                }
            })
        }

    };

    // redirect to scores screen/ edit screen
    finishExercise = () => {
        const {scores, currentScore, id, currentTime, times, noOfQuestions, goBackToEdit} = this.state;
        let exercise = this.props.location.state.exercise;

        if (goBackToEdit)
            this.props.history.push('/edit/mcq', {exercise: exercise});
        else {
            scores.push(currentScore);
            times.push(currentTime);
            this.props.addScoreTime(id, currentScore, currentTime);
            this.props.history.push('/scores', {
                scores: scores,
                userScore: currentScore,
                times: times,
                userTime: currentTime,
                noOfQuestions: noOfQuestions,
                exercise: exercise,
                type: "MCQ"
            });
        }
    };

    speak = (elem, text) => {
        let audioElem = elem;
        let myDataUrl = meSpeak.speak(text, {rawdata: 'data-url'});
		let sound = new Audio(myDataUrl);
        audioElem.classList.remove("button-off");
        audioElem.classList.add("button-on");
        sound.play();
        sound.onended = () => {
            audioElem.classList.remove("button-on");
            audioElem.classList.add("button-off");
        }
    }

    render() {
        const {currentQuestion} = this.state;
        const {showMedia} = this.props;
        const {id} = currentQuestion;

        let question;
        let questionType = currentQuestion.question.type; 
        if( questionType === this.multimedia.text)
            question = (
               <p>{id}. {currentQuestion.question.data}</p>
            );
        if( questionType === this.multimedia.image)
            question = (
                <div>
                    {id}.
                    <p style = {{textAlign: 'center'}}>
                        <img src = {currentQuestion.question.data}
                            style = {{height: '200px'}}
                            onClick = {()=>{showMedia(currentQuestion.question.data)}}
                            alt="Question"/>
                    </p>
                </div>
            );
        if( questionType === this.multimedia.audio)
            question = (
                <div>
                    {id}.
                    <p style = {{textAlign: 'center'}}>
                        <audio src={currentQuestion.question.data} controls>
                        </audio>
                    </p>
                </div>
                
            );
        if( questionType === this.multimedia.textToSpeech) {
            question = (
                <div>
                    {id}.
                    <span style={{marginLeft: '10px'}}>
                        <img className="button-off"
                            onClick={(e)=>{this.speak(e.target, currentQuestion.question.data)}}
                            alt="text-to-speech-question"
                        />
                    </span>
                </div>
                
            );
        }
        if( questionType === this.multimedia.video)
            question = (
                <div>
                    {id}.
                    <p style = {{textAlign: 'center'}}>
                        <video src={currentQuestion.question.data} controls
                            height="250px">
                        </video>
                    </p>
                </div>
            );

        let choices = currentQuestion.options.map((option, i) => {
            let btn = 'btn-outline-secondary';
            if (this.state.selectedAns === option.data) {
                btn = 'btn-selected';
            }
            if (this.state.submitted) {
                if (this.state.selectedAns === this.state.currentQuestion.correctAns.data) {
                    if (option.data === this.state.selectedAns) {
                        btn = 'btn-success';
                    }
                } else {
                    if (option.data === this.state.currentQuestion.correctAns.data) {
                        btn = 'btn-success';
                    }
                    if (this.state.selectedAns === option.data) {
                        btn = 'btn-danger';
                    }
                }
            }
            let optionElement;
            let optionsType = option.type;
            if( optionsType === this.multimedia.text)
                optionElement = option.data;
            if( optionsType === this.multimedia.image)
                optionElement = (
                    <img src = {option.data}
                            style = {{height: '100px'}}
                            onClick = {()=>{showMedia(option.data)}}
                            alt="Option"/>
                );
            if( optionsType === this.multimedia.audio)
                optionElement = (
                    <audio  className="audio-option"
                            src={option.data}
                            controls>
                    </audio>
                );
            if( optionsType === this.multimedia.textToSpeech) {
                optionElement = (
                    <img className="button-off"
                        alt="text-to-speech-option"
                    />
                );
            }
            if( optionsType === this.multimedia.video)
                optionElement = (
                    <video  src={option.data} controls
                            height="100px">
                    </video>
                );
            return (
                <div className="choices col-md-6" key={`answers-${i}` }>
                        <input type="radio" 
                            className="options-radio"
                            checked={option.data === this.state.selectedAns}
                            onChange={()=>{
                                this.setState({
                                    ...this.state, 
                                    selectedAns: option.data,
                                    selected: true
                                })
                            }}
                            disabled={this.state.submitted}
                            />   
                        <button
                            className={"btn choices-but " + btn}
                            type="button"
                            id={`answer-${i}`}
                            onClick={(e) => {
                                if( optionsType === this.multimedia.textToSpeech) {
                                    let elem = e.target;
                                    if(e.target.getAttribute("type")==='button')
                                        elem = e.target.children[0];
                                    this.speak(elem, option.data);
                                }
                                this.choiceSelected(option.data)}
                            }
                        >
                        {optionElement}
                        </button>
                </div>
            )
        });

        let buttonText = <FormattedMessage id={SUBMIT_QUESTION}/>;
        if (this.state.submitted) {
            buttonText = <FormattedMessage id={NEXT_QUESTION}/>;
            if (this.state.finish) buttonText = <FormattedMessage id={FINISH_EXERCISE}/>;
        }

        return (
            <div className="container mcq-container">
                <div className="row align-items-center justify-content-center">
                    <div className="col-sm-10">
                        <div className="col-md-12">
                            <div className="jumbotron">
                                <p className="lead">{this.state.title}</p>
                                <hr className="my-4"/>
                                {question}
                            </div>
                            <div className="col-md-12">
                                {choices}
                            </div>
                            <div className="d-flex flex-row-reverse">
                                <div className="justify-content-end">
                                    <button
                                        onClick={() => {
                                            if (this.state.selected) this.submitQuestion();
                                            else if (this.state.submitted) this.nextQuestion();
                                        }}
                                        className={"btn next-button"}
                                        disabled={!this.state.selected && !this.state.submitted}
                                    >
                                        {buttonText}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

}

function MapStateToProps(state) {
    return {}
}

export default withMultimedia(require('../../images/mcq_image.svg'))(withRouter(
    connect(MapStateToProps, {addScoreTime})(MCQPlayer)));