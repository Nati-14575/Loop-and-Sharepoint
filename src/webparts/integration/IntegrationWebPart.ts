import * as React from "react";
import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { IReadonlyTheme } from "@microsoft/sp-component-base";

import * as strings from "IntegrationWebPartStrings";
import RootShell from "./components/RootShell";
import { createMount, RootHandle } from "./utils/mount";
import { setSpfxCtx } from "./utils/spfxCtx";
export interface IIntegrationWebPartProps {
  description: string;
}

export default class IntegrationWebPart extends BaseClientSideWebPart<IIntegrationWebPartProps> {
  private _root: RootHandle | undefined;

  public render(): void {
    setSpfxCtx(this.context);
    const element = React.createElement(RootShell, {
      spfx: { context: this.context },
    });

    if (!this._root) {
      this._root = createMount(this.domElement);
    }
    this._root.render(element);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then((message) => {});
  }

  private _getEnvironmentMessage(): Promise<string> {
    const teams = this.context.sdks?.microsoftTeams;
    if (teams) {
      return teams.teamsJs.app.getContext().then((context) => {
        let msg = "";
        switch (context.app.host.name) {
          case "Office":
            msg = this.context.isServedFromLocalhost
              ? strings.AppLocalEnvironmentOffice
              : strings.AppOfficeEnvironment;
            break;
          case "Outlook":
            msg = this.context.isServedFromLocalhost
              ? strings.AppLocalEnvironmentOutlook
              : strings.AppOutlookEnvironment;
            break;
          case "Teams":
          case "TeamsModern":
            msg = this.context.isServedFromLocalhost
              ? strings.AppLocalEnvironmentTeams
              : strings.AppTeamsTabEnvironment;
            break;
          default:
            msg = strings.UnknownEnvironment;
        }
        return msg;
      });
    }
    return Promise.resolve(
      this.context.isServedFromLocalhost
        ? strings.AppLocalEnvironmentSharePoint
        : strings.AppSharePointEnvironment
    );
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) return;

    const { semanticColors } = currentTheme;
    if (semanticColors) {
      this.domElement.style.setProperty(
        "--bodyText",
        semanticColors.bodyText ?? null
      );
      this.domElement.style.setProperty("--link", semanticColors.link ?? null);
      this.domElement.style.setProperty(
        "--linkHovered",
        semanticColors.linkHovered ?? null
      );
    }
  }

  protected onDispose(): void {
    this._root?.unmount();
    this._root = undefined;
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("description", {
                  label: strings.DescriptionFieldLabel,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
