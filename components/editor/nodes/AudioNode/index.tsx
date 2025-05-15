import { DecoratorNode } from "lexical";
import React from "react";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css'; 


export class AudioNode extends DecoratorNode<JSX.Element> {
  __audioSrc: string;

  constructor(hiddenText: string, key?: string) {
    super(key);
    this.__audioSrc = hiddenText;
  }

  static getType(): string {
    return "audio";
  }

  static clone(node: AudioNode): AudioNode {
    return new AudioNode(node.__audioSrc, node.__key);
  }

  static importJSON(serializedNode: any): AudioNode {
    const { audioSrc } = serializedNode;
    return new AudioNode(audioSrc);
  }

  exportJSON(): any {
    return {
      type: "audio",
      version: 1,
      audioSrc: this.__audioSrc,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement("span");
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return   <AudioPlayer
    autoPlay={false}
    src={this.__audioSrc}
    onPlay={e => console.log("onPlay")}
    // other props here
  />
  }
}

export const $createAudioNode = (audioSrc: string): AudioNode => {
  return new AudioNode(audioSrc);
}
